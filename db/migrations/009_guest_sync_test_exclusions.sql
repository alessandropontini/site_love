begin;

-- Internal eligibility state, NOT an external Sheet identity or automatic test
-- classification. Existing and future households start unclassified/eligible.
create table rsvp.guest_sync_exclusions (
  household_id uuid primary key references rsvp.households(id) on delete cascade,
  active boolean not null default false,
  revision integer not null default 0 check (revision >= 0),
  check (not active or revision > 0),
  unique (household_id, active)
);
create table rsvp.guest_sync_exclusion_events (
  id bigint generated always as identity primary key,
  household_id uuid not null references rsvp.guest_sync_exclusions(household_id),
  revision integer not null check (revision > 0),
  active boolean not null,
  actor_id varchar(255) not null check (length(btrim(actor_id)) > 0),
  reason varchar(40) not null check (reason in ('CONFIRMED_TEST', 'CLASSIFICATION_REVOKED')),
  created_at timestamptz not null default now(),
  unique (household_id, revision),
  check ((active and reason='CONFIRMED_TEST') or (not active and reason='CLASSIFICATION_REVOKED'))
);
insert into rsvp.guest_sync_exclusions(household_id) select id from rsvp.households;

create function rsvp.initialize_guest_sync_eligibility() returns trigger
language plpgsql security definer set search_path = pg_catalog, rsvp as $$
begin
  insert into rsvp.guest_sync_exclusions(household_id) values(new.id);
  return new;
end
$$;
create trigger guest_sync_initialize_eligibility after insert on rsvp.households
  for each row execute function rsvp.initialize_guest_sync_eligibility();

-- Composite FK enforces exclusion/membership mutual exclusion even across
-- concurrent transactions or direct inserts. Mapped rows can only target false.
alter table rsvp.guest_sync_members add column exclusion_active boolean not null default false
  check (exclusion_active = false);
alter table rsvp.guest_sync_members add constraint guest_sync_member_not_excluded
  foreign key (household_id, exclusion_active)
  references rsvp.guest_sync_exclusions(household_id, active);

-- Operator-only entry point. No grants to application/sync roles. Caller must
-- verify DEVELOPMENT, authorization, backup and exact IDs before invoking.
create function rsvp.set_guest_sync_test_exclusion(
  target uuid, excluded boolean, expected_revision integer, actor text, reason text
) returns integer language plpgsql security definer set search_path = pg_catalog, rsvp as $$
declare current_state rsvp.guest_sync_exclusions%rowtype; next_revision integer;
begin
  if excluded is null or expected_revision is null or expected_revision < 0
    or actor is null or length(btrim(actor))=0 or length(actor)>255
    or reason is distinct from (case when excluded then 'CONFIRMED_TEST' else 'CLASSIFICATION_REVOKED' end)
    then raise exception 'INVALID_EXCLUSION_REQUEST'; end if;
  perform set_config('lock_timeout','5s',true);
  perform pg_advisory_xact_lock(791203, 1);
  lock table rsvp.households, rsvp.invitees, rsvp.responses,
    rsvp.additional_guests, rsvp.guest_sync_members, rsvp.guest_sync_exclusions in share row exclusive mode;
  select * into current_state from rsvp.guest_sync_exclusions where household_id=target for update;
  if not found then raise exception 'UNKNOWN_HOUSEHOLD'; end if;
  if current_state.revision <> expected_revision then raise exception 'EXCLUSION_CHANGED'; end if;
  if current_state.active = excluded then return current_state.revision; end if;
  if excluded and exists(select 1 from rsvp.guest_sync_members where household_id=target)
    then raise exception 'MAPPED_HOUSEHOLD'; end if;
  next_revision := current_state.revision + 1;
  update rsvp.guest_sync_exclusions set active=excluded, revision=next_revision where household_id=target;
  insert into rsvp.guest_sync_exclusion_events(household_id,revision,active,actor_id,reason)
    values(target,next_revision,excluded,actor,reason);
  return next_revision;
end
$$;

create or replace function rsvp.guest_sync_snapshot() returns jsonb language sql stable security definer set search_path = pg_catalog, rsvp as $$
  select jsonb_build_object(
    'contractVersion', 2,
    'exclusions', coalesce((select jsonb_agg(jsonb_build_object(
      'householdId', e.household_id, 'active', e.active, 'revision', e.revision
    ) order by e.household_id) from rsvp.guest_sync_exclusions e where e.revision > 0), '[]'::jsonb),
    'households', coalesce((select jsonb_agg(jsonb_build_object(
      'id', h.id, 'name', h.display_name, 'owner', h.invited_by,
      'plusOne', h.allow_plus_one, 'issued', h.token_hash is not null,
      'responded', h.response_version > 0 or exists(select 1 from rsvp.responses r where r.household_id=h.id)
        or exists(select 1 from rsvp.additional_guests a where a.household_id=h.id),
      'version', h.response_version, 'status', h.status,
      'namedCount', (select count(*) from rsvp.invitees i where i.household_id=h.id)
    ) order by h.id) from rsvp.households h), '[]'::jsonb),
    'members', coalesce((select jsonb_agg(jsonb_build_object(
      'externalId', m.external_id, 'householdId', m.household_id,
      'inviteeId', m.invitee_id, 'data', m.data, 'actualName', i.display_name
    ) order by m.external_id) from rsvp.guest_sync_members m
      left join rsvp.invitees i on i.id=m.invitee_id), '[]'::jsonb),
    'inviteeCount', (select count(*) from rsvp.invitees),
    'sources', coalesce((select jsonb_agg(s.source_id order by s.source_id) from
      (select distinct source_id from rsvp.guest_sync_members) s), '[]'::jsonb)
  )
$$;

create function rsvp.apply_guest_sync(
  batch_id uuid, actor text, source text, expected_hash text,
  changes jsonb, counts jsonb, duration integer, contract_version integer
) returns text language plpgsql security definer set search_path = pg_catalog, rsvp as $$
declare
  c jsonb; g jsonb; hid uuid; iid uuid; existing rsvp.guest_sync_runs%rowtype; started timestamptz := clock_timestamp();
begin
  if contract_version is distinct from 2 then raise exception 'SYNC_CONTRACT_VERSION'; end if;
  perform set_config('lock_timeout','5s',true);
  perform set_config('statement_timeout','15s',true);
  perform pg_advisory_xact_lock(791203, 1);
  select * into existing from rsvp.guest_sync_runs where id=batch_id;
  if found then
    if existing.actor_id <> actor or existing.source_id <> source then raise exception 'BATCH_OWNER'; end if;
    return existing.status;
  end if;
  lock table rsvp.households, rsvp.invitees, rsvp.responses,
    rsvp.additional_guests, rsvp.guest_sync_members, rsvp.guest_sync_exclusions in share row exclusive mode;
  if md5(rsvp.guest_sync_snapshot()::text) <> expected_hash then
    insert into rsvp.guest_sync_runs(id,actor_id,source_id,status,error_code,duration_ms)
      values(batch_id,actor,source,'CONFLICT','DATABASE_CHANGED',duration);
    return 'CONFLICT';
  end if;
  -- Global validation cannot be bypassed by omitting a household from a forged plan.
  if exists(select 1 from rsvp.households h where
    not exists(select 1 from rsvp.guest_sync_members m where m.household_id=h.id)
    and not exists(select 1 from rsvp.guest_sync_exclusions e where e.household_id=h.id and e.active)
  ) then raise exception 'UNMAPPED_HOUSEHOLDS'; end if;
  if exists(select 1 from rsvp.guest_sync_members where source_id <> source) then raise exception 'SOURCE_CHANGED'; end if;
  if jsonb_typeof(changes) <> 'array' or jsonb_array_length(changes) > 10000 then raise exception 'INVALID_PLAN'; end if;
  for c in select value from jsonb_array_elements(changes) loop
    if jsonb_array_length(c->'errors') <> 0 then raise exception 'INVALID_PLAN'; end if;
    if exists(select 1 from rsvp.guest_sync_exclusions e
      join rsvp.households h on h.id=e.household_id where e.active and
      (e.household_id=(c->>'householdId')::uuid or
       lower(h.display_name)=lower(c->'next'->>'party'))
    ) then raise exception 'EXCLUDED_HOUSEHOLD'; end if;
    if c->>'operation' not in ('INSERT','UPDATE') then continue; end if;
    g := c->'next';
    hid := (c->>'householdId')::uuid;
    if hid is null then
      -- New members of one new party share a household created in this batch.
      select h.id into hid from rsvp.households h join rsvp.guest_sync_members m on m.household_id=h.id
        where m.source_id=source and m.data->>'party'=g->>'party' limit 1;
      if hid is null then
        if exists(select 1 from rsvp.households where lower(display_name)=lower(g->>'party')) then raise exception 'HOUSEHOLD_COLLISION'; end if;
        insert into rsvp.households(display_name,token_hash,status,invited_by,preferred_locale)
          values(g->>'party',null,'disabled',g->>'owner',case when g->>'owner'='bride' then 'en' else 'it' end)
          returning id into hid;
      end if;
    end if;
    if exists(select 1 from rsvp.households h where h.id=hid and
      (h.response_version > 0 or exists(select 1 from rsvp.responses where household_id=hid)
        or exists(select 1 from rsvp.additional_guests where household_id=hid))) then raise exception 'RSVP_CONFLICT'; end if;
    if c->>'operation'='INSERT' then
      if exists(select 1 from rsvp.households where id=hid and token_hash is not null) then raise exception 'ISSUED_CONFLICT'; end if;
      iid := null;
      if g->>'kind'='named' then
        insert into rsvp.invitees(household_id,display_name) values(hid,g->>'name') returning id into iid;
      end if;
      insert into rsvp.guest_sync_members(external_id,source_id,household_id,invitee_id,data)
        values((g->>'externalId')::uuid,source,hid,iid,g);
    else
      if not exists(select 1 from rsvp.guest_sync_members where external_id=(g->>'externalId')::uuid
        and household_id=hid and source_id=source and data->>'party'=g->>'party' and data->>'kind'=g->>'kind') then raise exception 'MAPPING_CONFLICT'; end if;
      if exists(select 1 from rsvp.households h join rsvp.guest_sync_members m on m.household_id=h.id
        where h.id=hid and h.token_hash is not null and m.external_id=(g->>'externalId')::uuid
        and m.data->>'name' is distinct from g->>'name') then raise exception 'ISSUED_CONFLICT'; end if;
      update rsvp.invitees set display_name=g->>'name' where id=(select invitee_id from rsvp.guest_sync_members where external_id=(g->>'externalId')::uuid)
        and display_name is distinct from g->>'name';
      update rsvp.guest_sync_members set data=g where external_id=(g->>'externalId')::uuid;
    end if;
    -- Do not touch updated_at: the RSVP UI uses it to highlight the last reply.
    update rsvp.households set invited_by=g->>'owner' where id=hid;
  end loop;
  -- Only changed households may have planning permission reconciled.
  -- Entirely missing households and unchanged batches must not be mutated.
  update rsvp.households h set allow_plus_one=exists(
    select 1 from rsvp.guest_sync_members m where m.household_id=h.id and m.data->>'kind'='plus_one'
  ) where h.token_hash is null
    and h.allow_plus_one is distinct from exists(
      select 1 from rsvp.guest_sync_members m where m.household_id=h.id and m.data->>'kind'='plus_one'
    ) and exists(
      select 1 from jsonb_array_elements(changes) as planned(change)
      join rsvp.guest_sync_members m on m.external_id=(planned.change->'next'->>'externalId')::uuid
      where planned.change->>'operation' in ('INSERT','UPDATE') and m.household_id=h.id and m.source_id=source
    );
  insert into rsvp.guest_sync_runs(id,actor_id,source_id,status,created_records,updated_records,
    unchanged_records,missing_records,validation_errors,duration_ms)
    values(batch_id,actor,source,'SUCCESS',(counts->>'created')::int,(counts->>'updated')::int,
      (counts->>'unchanged')::int,(counts->>'missing')::int,0,duration + (extract(epoch from clock_timestamp()-started)*1000)::int);
  return 'SUCCESS';
end
$$;

-- Retain the old signature only as a fail-closed upgrade message. Old servers
-- must not silently apply a plan under a different contract.
create or replace function rsvp.apply_guest_sync(
  batch_id uuid, actor text, source text, expected_hash text,
  changes jsonb, counts jsonb, duration integer
) returns text language plpgsql security definer set search_path = pg_catalog, rsvp as $$
begin
  raise exception 'SYNC_CONTRACT_VERSION';
end
$$;

revoke all on rsvp.guest_sync_exclusions, rsvp.guest_sync_exclusion_events from public;
revoke all on sequence rsvp.guest_sync_exclusion_events_id_seq from public;
revoke all on function rsvp.initialize_guest_sync_eligibility() from public;
revoke all on function rsvp.set_guest_sync_test_exclusion(uuid,boolean,integer,text,text) from public;
revoke all on function rsvp.apply_guest_sync(uuid,text,text,text,jsonb,jsonb,integer,integer) from public;
do $$
begin
  if exists(select 1 from pg_roles where rolname='site_love_sync') then
    revoke all on rsvp.guest_sync_exclusions, rsvp.guest_sync_exclusion_events from site_love_sync;
    revoke all on sequence rsvp.guest_sync_exclusion_events_id_seq from site_love_sync;
    revoke all on function rsvp.set_guest_sync_test_exclusion(uuid,boolean,integer,text,text) from site_love_sync;
    revoke all on function rsvp.initialize_guest_sync_eligibility() from site_love_sync;
    grant execute on function rsvp.apply_guest_sync(uuid,text,text,text,jsonb,jsonb,integer,integer) to site_love_sync;
  end if;
end
$$;
commit;
