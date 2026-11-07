begin;

-- Metadata-only idempotency journal. The bearer token is never stored here.
create table rsvp.imported_household_invitation_events (
  id uuid primary key,
  source_id varchar(150) not null,
  external_household_id uuid not null,
  household_id uuid not null,
  actor_id varchar(255) not null check (length(btrim(actor_id)) between 1 and 255),
  request_hash varchar(32) not null check (request_hash ~ '^[0-9a-f]{32}$'),
  created_at timestamptz not null default now(),
  unique (source_id, external_household_id),
  unique (household_id),
  foreign key (source_id, external_household_id, household_id)
    references rsvp.guest_sync_households(source_id, external_household_id, household_id)
);

create function rsvp.activate_imported_household_invitation(
  event_id uuid,
  actor text,
  target_source text,
  external_household uuid,
  target_household uuid,
  expected_response_version integer,
  new_token_hash text
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, rsvp as $$
declare
  existing rsvp.imported_household_invitation_events%rowtype;
  target rsvp.households%rowtype;
  request_hash_value text;
  mapping_count integer;
  member_count integer;
  named_count integer;
begin
  if event_id is null or actor is null or length(btrim(actor)) not between 1 and 255 or
    target_source is null or length(btrim(target_source)) not between 1 and 150 or
    external_household is null or target_household is null or
    expected_response_version is distinct from 0 or
    new_token_hash is null or new_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVALID_IMPORTED_ACTIVATION_REQUEST';
  end if;

  request_hash_value := md5(jsonb_build_object(
    'id', event_id, 'actor', actor, 'source', target_source,
    'externalHouseholdId', external_household, 'householdId', target_household,
    'expectedResponseVersion', expected_response_version, 'tokenHash', new_token_hash
  )::text);

  perform set_config('lock_timeout','5s',true);
  perform set_config('statement_timeout','15s',true);
  -- Serialize with synchronization, UUID reconciliation, exclusions and RSVP writes.
  perform pg_advisory_xact_lock(791203,1);
  lock table rsvp.households, rsvp.invitees, rsvp.responses,
    rsvp.additional_guests, rsvp.guest_sync_members, rsvp.guest_sync_exclusions,
    rsvp.guest_sync_sources, rsvp.guest_sync_households,
    rsvp.imported_household_invitation_events in share row exclusive mode;

  select * into existing from rsvp.imported_household_invitation_events where id=event_id;
  if found then
    if existing.actor_id <> actor or existing.source_id <> target_source or
      existing.external_household_id <> external_household or
      existing.household_id <> target_household or existing.request_hash <> request_hash_value then
      raise exception 'IMPORTED_ACTIVATION_EVENT_REUSED';
    end if;
    return jsonb_build_object('status','active','replayed',true);
  end if;

  if exists(select 1 from rsvp.imported_household_invitation_events e
    where e.source_id=target_source and e.external_household_id=external_household)
    then raise exception 'IMPORTED_INVITATION_ALREADY_ACTIVATED'; end if;

  select count(*) into mapping_count from rsvp.guest_sync_sources
    where source_id=target_source and mode='household_uuid';
  if mapping_count <> 1 then raise exception 'IMPORTED_SOURCE_MODE_REQUIRED'; end if;
  select count(*) into mapping_count from rsvp.guest_sync_households
    where source_id=target_source and external_household_id=external_household
      and household_id=target_household;
  if mapping_count <> 1 then raise exception 'IMPORTED_MAPPING_CHANGED'; end if;
  if exists(select 1 from rsvp.guest_sync_exclusions
    where household_id=target_household and active)
    then raise exception 'IMPORTED_HOUSEHOLD_EXCLUDED'; end if;

  select * into target from rsvp.households where id=target_household for update;
  if not found or target.status <> 'disabled' or target.token_hash is not null or
    target.revoked_at is not null or target.response_version <> expected_response_version or
    exists(select 1 from rsvp.responses where household_id=target_household) or
    exists(select 1 from rsvp.additional_guests where household_id=target_household)
    then raise exception 'IMPORTED_HOUSEHOLD_INCOMPATIBLE'; end if;

  select count(*) into member_count from rsvp.guest_sync_members
    where source_id=target_source and external_household_id=external_household
      and household_id=target_household;
  select count(*) into named_count from rsvp.guest_sync_members
    where source_id=target_source and external_household_id=external_household
      and household_id=target_household and data->>'kind'='named';
  if member_count=0 or
    exists(select 1 from rsvp.guest_sync_members m where m.household_id=target_household
      and (m.source_id <> target_source or m.external_household_id is distinct from external_household)) or
    exists(select 1 from rsvp.guest_sync_members m left join rsvp.invitees i
      on i.id=m.invitee_id and i.household_id=m.household_id
      where m.source_id=target_source and m.external_household_id=external_household
        and m.household_id=target_household and (
          (m.data->>'kind'='named' and (m.invitee_id is null or i.id is null or i.display_name is distinct from m.data->>'name')) or
          (m.data->>'kind'<>'named' and m.invitee_id is not null) or
          m.data->>'party' is distinct from target.display_name or
          m.data->>'owner' is distinct from target.invited_by
        )) or
    named_count <> (select count(*) from rsvp.invitees where household_id=target_household) or
    target.allow_plus_one is distinct from exists(select 1 from rsvp.guest_sync_members
      where source_id=target_source and external_household_id=external_household
        and household_id=target_household and data->>'kind'='plus_one')
    then raise exception 'IMPORTED_ROSTER_INCONSISTENT'; end if;

  update rsvp.households set token_hash=new_token_hash,status='active'
    where id=target_household and token_hash is null and status='disabled';
  if not found then raise exception 'IMPORTED_HOUSEHOLD_INCOMPATIBLE'; end if;
  insert into rsvp.imported_household_invitation_events(
    id,source_id,external_household_id,household_id,actor_id,request_hash
  ) values(event_id,target_source,external_household,target_household,actor,request_hash_value);

  return jsonb_build_object('status','active','replayed',false);
end
$$;

revoke all on rsvp.imported_household_invitation_events from public;
revoke all on function rsvp.activate_imported_household_invitation(uuid,text,text,uuid,uuid,integer,text) from public;
do $$ begin
  if exists(select 1 from pg_roles where rolname='site_love_sync') then
    revoke all on rsvp.imported_household_invitation_events from site_love_sync;
    grant execute on function rsvp.activate_imported_household_invitation(uuid,text,text,uuid,uuid,integer,text)
      to site_love_sync;
  end if;
  if exists(select 1 from pg_roles where rolname='site_love_app') then
    revoke all on rsvp.imported_household_invitation_events from site_love_app;
    revoke all on function rsvp.activate_imported_household_invitation(uuid,text,text,uuid,uuid,integer,text)
      from site_love_app;
  end if;
end $$;
commit;
