begin;

-- Imported planning households are disabled and have no invitation credential.
-- Existing hashes and all RSVP response columns remain untouched.
alter table rsvp.households alter column token_hash drop not null;
alter table rsvp.households add constraint guest_sync_unissued_disabled
  check (token_hash is not null or status = 'disabled');

create table rsvp.guest_sync_members (
  external_id uuid primary key,
  source_id varchar(150) not null,
  household_id uuid not null references rsvp.households(id),
  invitee_id uuid unique references rsvp.invitees(id),
  foreign key (household_id, invitee_id) references rsvp.invitees(household_id, id),
  data jsonb not null,
  check (data->>'externalId' = external_id::text),
  check (data->>'kind' in ('named', 'child', 'plus_one')),
  check ((data->>'kind' = 'named') = (invitee_id is not null))
);
create index guest_sync_members_household on rsvp.guest_sync_members(household_id);

create table rsvp.guest_sync_runs (
  id uuid primary key,
  actor_id varchar(255) not null,
  source_id varchar(150) not null,
  created_at timestamptz not null default now(),
  status varchar(16) not null check (status in ('SUCCESS','FAILED','CANCELLED','CONFLICT')),
  created_records integer not null default 0,
  updated_records integer not null default 0,
  unchanged_records integer not null default 0,
  missing_records integer not null default 0,
  validation_errors integer not null default 0,
  duration_ms integer not null default 0,
  error_code varchar(40)
);

-- Consistent, private, minimal snapshot. Hash and payload are obtained in the
-- same SQL statement. No emails, response contents or token hashes are exposed.
create function rsvp.guest_sync_snapshot() returns jsonb language sql stable security definer set search_path = pg_catalog, rsvp as $$
  select jsonb_build_object(
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

-- Restricted SECURITY DEFINER entrypoint; the sync role has no direct RSVP writes.
-- Short table locks serialize batches and RSVP writes. Google is read BEFORE
-- entering this transaction, so network waits never hold database locks.
create function rsvp.apply_guest_sync(
  batch_id uuid, actor text, source text, expected_hash text,
  changes jsonb, counts jsonb, duration integer
) returns text language plpgsql security definer set search_path = pg_catalog, rsvp as $$
declare
  c jsonb; g jsonb; hid uuid; iid uuid; existing rsvp.guest_sync_runs%rowtype; started timestamptz := clock_timestamp();
begin
  perform set_config('lock_timeout','5s',true);
  perform set_config('statement_timeout','15s',true);
  perform pg_advisory_xact_lock(791203, 1);
  select * into existing from rsvp.guest_sync_runs where id=batch_id;
  if found then
    if existing.actor_id <> actor or existing.source_id <> source then raise exception 'BATCH_OWNER'; end if;
    return existing.status;
  end if;
  lock table rsvp.households, rsvp.invitees, rsvp.responses,
    rsvp.additional_guests, rsvp.guest_sync_members in share row exclusive mode;
  if md5(rsvp.guest_sync_snapshot()::text) <> expected_hash then
    insert into rsvp.guest_sync_runs(id,actor_id,source_id,status,error_code,duration_ms)
      values(batch_id,actor,source,'CONFLICT','DATABASE_CHANGED',duration);
    return 'CONFLICT';
  end if;
  if exists(select 1 from rsvp.guest_sync_members where source_id <> source) then raise exception 'SOURCE_CHANGED'; end if;
  if jsonb_typeof(changes) <> 'array' or jsonb_array_length(changes) > 10000 then raise exception 'INVALID_PLAN'; end if;
  for c in select value from jsonb_array_elements(changes) loop
    if jsonb_array_length(c->'errors') <> 0 then raise exception 'INVALID_PLAN'; end if;
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

revoke all on rsvp.guest_sync_members, rsvp.guest_sync_runs from public;
revoke all on function rsvp.guest_sync_snapshot() from public;
revoke all on function rsvp.apply_guest_sync(uuid,text,text,text,jsonb,jsonb,integer) from public;
-- Grant to a separate server-only sync role, NOT the public RSVP role. See docs.
do $$
begin
  if exists(select 1 from pg_roles where rolname='site_love_sync') then
    grant usage on schema rsvp to site_love_sync;
    grant select, insert on rsvp.guest_sync_runs to site_love_sync;
    grant execute on function rsvp.guest_sync_snapshot() to site_love_sync;
    grant execute on function rsvp.apply_guest_sync(uuid,text,text,text,jsonb,jsonb,integer) to site_love_sync;
  end if;
end
$$;
commit;
