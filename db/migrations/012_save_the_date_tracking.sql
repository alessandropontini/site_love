begin;

-- Save the Date is private operational metadata. The event journal stores no
-- contact value, message body, RSVP answer, token, or QR payload.
create table rsvp.save_the_date_state (
  source_id varchar(150) not null,
  external_household_id uuid not null,
  household_id uuid not null,
  status text not null check (status in ('NOT_SENT','READY','SENT','FAILED')),
  version integer not null check (version > 0),
  updated_at timestamptz not null default now(),
  primary key (source_id, external_household_id),
  foreign key (source_id, external_household_id, household_id)
    references rsvp.guest_sync_households(source_id, external_household_id, household_id)
);

create table rsvp.save_the_date_events (
  id uuid primary key,
  source_id varchar(150) not null,
  external_household_id uuid not null,
  household_id uuid not null,
  contact_external_id uuid not null,
  actor_id varchar(255) not null check (length(btrim(actor_id)) between 1 and 255),
  previous_status text not null check (previous_status in ('NOT_SENT','READY','SENT','FAILED')),
  status text not null check (status in ('NOT_SENT','READY','SENT','FAILED')),
  version integer not null check (version > 0),
  channel text not null check (channel in ('sms','imessage','whatsapp','email','telegram','instagram','paper')),
  language text not null check (language in ('it','en')),
  template_version text not null check (template_version = 'std-draft-v1'),
  source_commitment varchar(64) not null check (source_commitment ~ '^[0-9a-f]{64}$'),
  database_commitment varchar(64) not null check (database_commitment ~ '^[0-9a-f]{64}$'),
  draft_commitment varchar(64) not null check (draft_commitment ~ '^[0-9a-f]{64}$'),
  request_hash varchar(32) not null check (request_hash ~ '^[0-9a-f]{32}$'),
  created_at timestamptz not null default now(),
  unique (source_id, external_household_id, version),
  foreign key (source_id, external_household_id, household_id)
    references rsvp.guest_sync_households(source_id, external_household_id, household_id)
);
create index save_the_date_events_household_created
  on rsvp.save_the_date_events(source_id, external_household_id, created_at desc);

create function rsvp.record_save_the_date(request jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, rsvp as $$
declare
  existing rsvp.save_the_date_events%rowtype;
  current_state rsvp.save_the_date_state%rowtype;
  target rsvp.guest_sync_households%rowtype;
  prior_status text;
  prior_version integer;
  event_id uuid;
  target_external uuid;
  target_household uuid;
  target_contact uuid;
begin
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'STD_REQUIRES_READ_COMMITTED';
  end if;
  if request is null or jsonb_typeof(request) <> 'object' or
    (select count(*) from jsonb_object_keys(request)) <> 14 or
    not request ?& array['id','source','household','householdId','contact','actor',
      'expectedVersion','status','channel','language','template','sourceCommitment',
      'databaseCommitment','draftCommitment'] or
    exists(select 1 from jsonb_each(request) e
      where e.key <> 'expectedVersion' and jsonb_typeof(e.value) <> 'string') or
    jsonb_typeof(request->'expectedVersion') <> 'number' or
    (request->>'expectedVersion') !~ '^(0|[1-9][0-9]{0,8})$' or
    length(btrim(request->>'source')) not between 1 and 150 or
    length(btrim(request->>'actor')) not between 1 and 255 or
    (request->>'status') not in ('NOT_SENT','READY','SENT','FAILED') or
    (request->>'channel') not in ('sms','imessage','whatsapp','email','telegram','instagram','paper') or
    (request->>'language') not in ('it','en') or
    (request->>'template') <> 'std-draft-v1' or
    (request->>'sourceCommitment') !~ '^[0-9a-f]{64}$' or
    (request->>'databaseCommitment') !~ '^[0-9a-f]{64}$' or
    (request->>'draftCommitment') !~ '^[0-9a-f]{64}$'
    then raise exception 'INVALID_STD_REQUEST';
  end if;

  event_id := (request->>'id')::uuid;
  target_external := (request->>'household')::uuid;
  target_household := (request->>'householdId')::uuid;
  target_contact := (request->>'contact')::uuid;
  perform set_config('lock_timeout','5s',true);
  perform set_config('statement_timeout','15s',true);
  -- Coordinate with sync, UUID reconciliation and exclusions using their lock.
  perform pg_advisory_xact_lock(791203,1);
  lock table rsvp.households, rsvp.guest_sync_members, rsvp.guest_sync_sources,
    rsvp.guest_sync_households, rsvp.guest_sync_exclusions,
    rsvp.save_the_date_state, rsvp.save_the_date_events
    in share row exclusive mode;

  select * into existing from rsvp.save_the_date_events where id=event_id;
  if found then
    if existing.request_hash <> md5(request::text) or
      existing.actor_id <> request->>'actor' or
      existing.source_id <> request->>'source' or
      existing.external_household_id <> target_external or
      existing.household_id <> target_household or
      existing.status <> request->>'status'
      then raise exception 'STD_EVENT_REUSED'; end if;
    return jsonb_build_object('status',existing.status,'version',existing.version,'replayed',true);
  end if;

  if not exists(select 1 from rsvp.guest_sync_sources
    where source_id=request->>'source' and mode='household_uuid')
    then raise exception 'STD_UUID_MODE_REQUIRED'; end if;
  select * into target from rsvp.guest_sync_households
    where source_id=request->>'source' and external_household_id=target_external;
  if not found or target.household_id <> target_household or
    not exists(select 1 from rsvp.guest_sync_members m
      where m.source_id=target.source_id and m.external_household_id=target_external
        and m.household_id=target_household and m.external_id=target_contact
        and m.invitee_id is not null and m.data->>'kind'='named')
    then raise exception 'STD_MAPPING_CHANGED'; end if;
  if exists(select 1 from rsvp.guest_sync_exclusions e
    where e.household_id=target_household and e.active)
    then raise exception 'STD_HOUSEHOLD_EXCLUDED'; end if;

  select * into current_state from rsvp.save_the_date_state
    where source_id=target.source_id and external_household_id=target_external for update;
  prior_status := coalesce(current_state.status,'NOT_SENT');
  prior_version := coalesce(current_state.version,0);
  if prior_version <> (request->>'expectedVersion')::integer
    then raise exception 'STD_VERSION_CONFLICT'; end if;
  if prior_status=request->>'status' or
    (prior_status='SENT' and request->>'status' <> 'NOT_SENT')
    then raise exception 'STD_INVALID_TRANSITION'; end if;

  insert into rsvp.save_the_date_state(source_id,external_household_id,household_id,status,version)
    values(target.source_id,target_external,target_household,request->>'status',prior_version+1)
    on conflict(source_id,external_household_id) do update
      set household_id=excluded.household_id,status=excluded.status,
        version=excluded.version,updated_at=now();
  insert into rsvp.save_the_date_events(id,source_id,external_household_id,household_id,
    contact_external_id,actor_id,previous_status,status,version,channel,language,
    template_version,source_commitment,database_commitment,draft_commitment,request_hash)
  values(event_id,target.source_id,target_external,target_household,target_contact,
    request->>'actor',prior_status,request->>'status',prior_version+1,request->>'channel',
    request->>'language',request->>'template',request->>'sourceCommitment',
    request->>'databaseCommitment',request->>'draftCommitment',md5(request::text));
  return jsonb_build_object('status',request->>'status','version',prior_version+1,'replayed',false);
end
$$;

revoke all on rsvp.save_the_date_state,rsvp.save_the_date_events from public;
revoke all on function rsvp.record_save_the_date(jsonb) from public;
do $$ begin
  if exists(select 1 from pg_roles where rolname='site_love_sync') then
    revoke all on rsvp.save_the_date_state,rsvp.save_the_date_events from site_love_sync;
    grant select on rsvp.save_the_date_state,rsvp.save_the_date_events to site_love_sync;
    grant execute on function rsvp.record_save_the_date(jsonb) to site_love_sync;
  end if;
  if exists(select 1 from pg_roles where rolname='site_love_app') then
    revoke all on rsvp.save_the_date_state,rsvp.save_the_date_events from site_love_app;
    revoke all on function rsvp.record_save_the_date(jsonb) from site_love_app;
  end if;
end $$;
commit;
