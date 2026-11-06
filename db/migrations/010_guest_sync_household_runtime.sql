begin;

-- Contract v3 adds explicit source mode and stable external household keys.
-- Existing sync sources are preserved as legacy; no Neon household is adopted.
create table rsvp.guest_sync_sources (
  source_id varchar(150) primary key,
  mode varchar(20) not null check (mode in ('legacy','household_uuid')),
  registered_at timestamptz not null default now()
);
insert into rsvp.guest_sync_sources(source_id,mode)
  select source_id,'legacy' from rsvp.guest_sync_members group by source_id
  on conflict(source_id) do nothing;
insert into rsvp.guest_sync_sources(source_id,mode)
  select source_id,'legacy' from rsvp.guest_sync_runs group by source_id
  on conflict(source_id) do nothing;

create table rsvp.guest_sync_source_mode_events (
  id bigint generated always as identity primary key,
  source_id varchar(150) not null,
  prior_mode varchar(20) check (prior_mode in ('legacy','household_uuid')),
  next_mode varchar(20) not null check (next_mode in ('legacy','household_uuid')),
  actor_id varchar(255) not null check (length(btrim(actor_id)) > 0),
  created_at timestamptz not null default now()
);

create table rsvp.guest_sync_households (
  source_id varchar(150) not null references rsvp.guest_sync_sources(source_id),
  external_household_id uuid not null,
  household_id uuid not null unique references rsvp.households(id),
  primary key (source_id, external_household_id),
  unique (source_id, external_household_id, household_id)
);
alter table rsvp.guest_sync_members add column external_household_id uuid;
alter table rsvp.guest_sync_members add constraint guest_sync_member_household_map
  foreign key (source_id, external_household_id, household_id)
  references rsvp.guest_sync_households(source_id, external_household_id, household_id);

-- Only the database owner may perform an explicit, optimistic mode transition.
-- It does not create mappings; UUID adoption must be reconciled separately.
create function rsvp.register_guest_sync_source_mode(
  target_source text, target_mode text, expected_mode text, actor text
) returns void language plpgsql security definer set search_path = pg_catalog, rsvp as $$
declare current_mode text;
begin
  if target_source is null or length(btrim(target_source))=0 or length(target_source)>150
    or target_mode not in ('legacy','household_uuid')
    or expected_mode not in ('legacy','household_uuid')
    or actor is null or length(btrim(actor))=0 or length(actor)>255
    then raise exception 'INVALID_SOURCE_MODE_REQUEST'; end if;
  perform pg_advisory_xact_lock(791203, 1);
  select mode into current_mode from rsvp.guest_sync_sources where source_id=target_source for update;
  if not found or current_mode is distinct from expected_mode then raise exception 'SOURCE_MODE_CHANGED'; end if;
  if current_mode=target_mode then return; end if;
  if target_mode='household_uuid' and exists (
    select 1 from rsvp.guest_sync_members m
    where m.source_id=target_source and (m.external_household_id is null or not exists (
      select 1 from rsvp.guest_sync_households h where h.source_id=m.source_id
        and h.external_household_id=m.external_household_id and h.household_id=m.household_id
    ))
  ) then raise exception 'HOUSEHOLD_RECONCILIATION_REQUIRED'; end if;
  if target_mode='legacy' and (exists(select 1 from rsvp.guest_sync_households where source_id=target_source)
    or exists(select 1 from rsvp.guest_sync_members where source_id=target_source and external_household_id is not null))
    then raise exception 'HOUSEHOLD_RECONCILIATION_REQUIRED'; end if;
  update rsvp.guest_sync_sources set mode=target_mode where source_id=target_source;
  insert into rsvp.guest_sync_source_mode_events(source_id,prior_mode,next_mode,actor_id)
    values(target_source,current_mode,target_mode,actor);
end
$$;

create or replace function rsvp.guest_sync_snapshot() returns jsonb language sql stable security definer set search_path = pg_catalog, rsvp as $$
  select jsonb_build_object(
    'contractVersion', 3,
    'exclusions', coalesce((select jsonb_agg(jsonb_build_object(
      'householdId', e.household_id, 'active', e.active, 'revision', e.revision
    ) order by e.household_id) from rsvp.guest_sync_exclusions e where e.revision > 0), '[]'::jsonb),
    'householdMappings', coalesce((select jsonb_agg(jsonb_build_object(
      'sourceId', m.source_id, 'externalHouseholdId', m.external_household_id,
      'householdId', m.household_id
    ) order by m.source_id,m.external_household_id) from rsvp.guest_sync_households m), '[]'::jsonb),
    'sourceModes', coalesce((select jsonb_agg(jsonb_build_object(
      'sourceId', s.source_id, 'mode', s.mode
    ) order by s.source_id) from rsvp.guest_sync_sources s), '[]'::jsonb),
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
      'externalHouseholdId', m.external_household_id,
      'inviteeId', m.invitee_id, 'data', m.data, 'actualName', i.display_name
    ) order by m.external_id) from rsvp.guest_sync_members m
      left join rsvp.invitees i on i.id=m.invitee_id), '[]'::jsonb),
    'inviteeCount', (select count(*) from rsvp.invitees),
    'sources', coalesce((select jsonb_agg(s.source_id order by s.source_id) from
      (select source_id from rsvp.guest_sync_sources) s), '[]'::jsonb)
  )
$$;

-- New explicit-mode Apply endpoint. Old 7/8-argument contracts remain
-- fail-closed. Every household UUID is resolved through a source-scoped map.
create function rsvp.apply_guest_sync(
  batch_id uuid, actor text, source text, expected_hash text,
  changes jsonb, counts jsonb, duration integer, contract_version integer, sync_mode text
) returns text language plpgsql security definer set search_path = pg_catalog, rsvp as $$
declare
  c jsonb; g jsonb; hid uuid; iid uuid; ext_hid uuid; existing rsvp.guest_sync_runs%rowtype;
  started timestamptz := clock_timestamp(); registered_mode text;
begin
  if contract_version is distinct from 3 or sync_mode not in ('legacy','household_uuid') then raise exception 'SYNC_CONTRACT_VERSION'; end if;
  perform set_config('lock_timeout','5s',true);
  perform set_config('statement_timeout','15s',true);
  perform pg_advisory_xact_lock(791203, 1);
  select * into existing from rsvp.guest_sync_runs where id=batch_id;
  if found then
    if existing.actor_id <> actor or existing.source_id <> source then raise exception 'BATCH_OWNER'; end if;
    return existing.status;
  end if;
  lock table rsvp.households,rsvp.invitees,rsvp.responses,rsvp.additional_guests,
    rsvp.guest_sync_members,rsvp.guest_sync_exclusions,rsvp.guest_sync_sources,
    rsvp.guest_sync_households in share row exclusive mode;
  if md5(rsvp.guest_sync_snapshot()::text) <> expected_hash then
    insert into rsvp.guest_sync_runs(id,actor_id,source_id,status,error_code,duration_ms)
      values(batch_id,actor,source,'CONFLICT','DATABASE_CHANGED',duration);
    return 'CONFLICT';
  end if;
  select mode into registered_mode from rsvp.guest_sync_sources where source_id=source for update;
  if registered_mode is null then
    insert into rsvp.guest_sync_sources(source_id,mode) values(source,sync_mode);
    insert into rsvp.guest_sync_source_mode_events(source_id,prior_mode,next_mode,actor_id)
      values(source,null,sync_mode,actor);
  elsif registered_mode is distinct from sync_mode then raise exception 'SOURCE_MODE_MISMATCH'; end if;
  if sync_mode='legacy' and exists(select 1 from rsvp.households h where
    not exists(select 1 from rsvp.guest_sync_members m where m.household_id=h.id)
    and not exists(select 1 from rsvp.guest_sync_exclusions e where e.household_id=h.id and e.active)
  ) then raise exception 'UNMAPPED_HOUSEHOLDS'; end if;
  if jsonb_typeof(changes) <> 'array' or jsonb_array_length(changes)>10000 then raise exception 'INVALID_PLAN'; end if;
  for c in select value from jsonb_array_elements(changes) loop
    if jsonb_typeof(c->'errors') <> 'array' or jsonb_array_length(c->'errors')<>0 then raise exception 'INVALID_PLAN'; end if;
    if exists(select 1 from rsvp.guest_sync_exclusions e join rsvp.households h on h.id=e.household_id
      where e.active and (e.household_id=nullif(c->>'householdId','')::uuid or lower(h.display_name)=lower(c->'next'->>'party')))
      then raise exception 'EXCLUDED_HOUSEHOLD'; end if;
    if c->>'operation' not in ('INSERT','UPDATE') then continue; end if;
    g:=c->'next';
    if sync_mode='household_uuid' then
      ext_hid:=nullif(c->>'householdUuid','')::uuid;
      if ext_hid is null then raise exception 'HOUSEHOLD_UUID_REQUIRED'; end if;
      select household_id into hid from rsvp.guest_sync_households where source_id=source and external_household_id=ext_hid for update;
      if hid is null then
        if exists(select 1 from rsvp.guest_sync_members where source_id=source and external_id=(g->>'externalId')::uuid)
          then raise exception 'HOUSEHOLD_RECONCILIATION_REQUIRED'; end if;
        if exists(select 1 from rsvp.guest_sync_members m join rsvp.guest_sync_households h
          on h.source_id=m.source_id and h.external_household_id=m.external_household_id and h.household_id=m.household_id
          where m.source_id=source and h.external_household_id=ext_hid)
          then raise exception 'HOUSEHOLD_MAPPING_CONFLICT'; end if;
        insert into rsvp.households(display_name,token_hash,status,invited_by,preferred_locale)
          values(g->>'party',null,'disabled',g->>'owner',case when g->>'owner'='bride' then 'en' else 'it' end)
          returning id into hid;
        insert into rsvp.guest_sync_households(source_id,external_household_id,household_id) values(source,ext_hid,hid);
      elsif nullif(c->>'householdId','')::uuid is distinct from hid then raise exception 'HOUSEHOLD_MAPPING_CONFLICT'; end if;
    else
      ext_hid:=null;
      hid:=nullif(c->>'householdId','')::uuid;
      if hid is null then
        select h.id into hid from rsvp.households h join rsvp.guest_sync_members m on m.household_id=h.id
          where m.source_id=source and m.data->>'party'=g->>'party' limit 1;
        if hid is null then
          if exists(select 1 from rsvp.households where lower(display_name)=lower(g->>'party')) then raise exception 'HOUSEHOLD_COLLISION'; end if;
          insert into rsvp.households(display_name,token_hash,status,invited_by,preferred_locale)
            values(g->>'party',null,'disabled',g->>'owner',case when g->>'owner'='bride' then 'en' else 'it' end) returning id into hid;
        end if;
      end if;
    end if;
    if exists(select 1 from rsvp.households h where h.id=hid and (h.response_version>0
      or exists(select 1 from rsvp.responses where household_id=hid)
      or exists(select 1 from rsvp.additional_guests where household_id=hid))) then raise exception 'RSVP_CONFLICT'; end if;
    if c->>'operation'='INSERT' then
      if exists(select 1 from rsvp.households where id=hid and token_hash is not null) then raise exception 'ISSUED_CONFLICT'; end if;
      if exists(select 1 from rsvp.guest_sync_members where external_id=(g->>'externalId')::uuid) then raise exception 'MAPPING_CONFLICT'; end if;
      iid:=null;
      if g->>'kind'='named' then insert into rsvp.invitees(household_id,display_name) values(hid,g->>'name') returning id into iid; end if;
      insert into rsvp.guest_sync_members(external_id,source_id,household_id,external_household_id,invitee_id,data)
        values((g->>'externalId')::uuid,source,hid,ext_hid,iid,g);
    else
      if not exists(select 1 from rsvp.guest_sync_members where external_id=(g->>'externalId')::uuid
        and household_id=hid and source_id=source and external_household_id is not distinct from ext_hid
        and data->>'kind'=g->>'kind') then raise exception 'MAPPING_CONFLICT'; end if;
      if exists(select 1 from rsvp.households h join rsvp.guest_sync_members m on m.household_id=h.id
        where h.id=hid and h.token_hash is not null and m.external_id=(g->>'externalId')::uuid
        and m.data->>'name' is distinct from g->>'name') then raise exception 'ISSUED_CONFLICT'; end if;
      update rsvp.invitees set display_name=g->>'name' where id=(select invitee_id from rsvp.guest_sync_members where external_id=(g->>'externalId')::uuid)
        and display_name is distinct from g->>'name';
      update rsvp.guest_sync_members set data=g where external_id=(g->>'externalId')::uuid;
    end if;
    if exists(select 1 from rsvp.households h where h.id=hid
      and (h.display_name is distinct from g->>'party' or h.invited_by is distinct from g->>'owner')
      and h.token_hash is not null) then raise exception 'ISSUED_CONFLICT'; end if;
    update rsvp.households set display_name=g->>'party',invited_by=g->>'owner' where id=hid;
  end loop;
  update rsvp.households h set allow_plus_one=exists(select 1 from rsvp.guest_sync_members m where m.household_id=h.id and m.data->>'kind'='plus_one')
    where h.token_hash is null and h.allow_plus_one is distinct from exists(select 1 from rsvp.guest_sync_members m where m.household_id=h.id and m.data->>'kind'='plus_one')
      and exists(select 1 from jsonb_array_elements(changes) p join rsvp.guest_sync_members m on m.external_id=(p.value->'next'->>'externalId')::uuid
        where p.value->>'operation' in ('INSERT','UPDATE') and m.household_id=h.id and m.source_id=source);
  insert into rsvp.guest_sync_runs(id,actor_id,source_id,status,created_records,updated_records,unchanged_records,missing_records,validation_errors,duration_ms)
    values(batch_id,actor,source,'SUCCESS',(counts->>'created')::int,(counts->>'updated')::int,(counts->>'unchanged')::int,
      (counts->>'missing')::int,0,duration+(extract(epoch from clock_timestamp()-started)*1000)::int);
  return 'SUCCESS';
end
$$;

-- Preserve fail-closed behavior for pre-v2 and v2 callers.
create or replace function rsvp.apply_guest_sync(batch_id uuid,actor text,source text,expected_hash text,
  changes jsonb,counts jsonb,duration integer,contract_version integer)
returns text language plpgsql security definer set search_path=pg_catalog,rsvp as $$ begin raise exception 'SYNC_CONTRACT_VERSION'; end $$;
create or replace function rsvp.apply_guest_sync(batch_id uuid,actor text,source text,expected_hash text,
  changes jsonb,counts jsonb,duration integer)
returns text language plpgsql security definer set search_path=pg_catalog,rsvp as $$ begin raise exception 'SYNC_CONTRACT_VERSION'; end $$;

revoke all on rsvp.guest_sync_sources,rsvp.guest_sync_source_mode_events,rsvp.guest_sync_households from public;
revoke all on sequence rsvp.guest_sync_source_mode_events_id_seq from public;
revoke all on function rsvp.register_guest_sync_source_mode(text,text,text,text) from public;
revoke all on function rsvp.apply_guest_sync(uuid,text,text,text,jsonb,jsonb,integer,integer,text) from public;
do $$ begin
  if exists(select 1 from pg_roles where rolname='site_love_sync') then
    revoke all on rsvp.guest_sync_sources,rsvp.guest_sync_source_mode_events,rsvp.guest_sync_households from site_love_sync;
    revoke all on sequence rsvp.guest_sync_source_mode_events_id_seq from site_love_sync;
    revoke all on function rsvp.register_guest_sync_source_mode(text,text,text,text) from site_love_sync;
    grant execute on function rsvp.apply_guest_sync(uuid,text,text,text,jsonb,jsonb,integer,integer,text) to site_love_sync;
  end if;
end $$;
commit;
