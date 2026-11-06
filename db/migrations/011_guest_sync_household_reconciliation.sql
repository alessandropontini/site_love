begin;

-- Metadata-only journal for explicit, owner-operated reconciliation. The
-- operator supplies the reviewed UUID membership; this migration invents none.
create table rsvp.guest_sync_household_mapping_events (
  id bigint generated always as identity primary key,
  source_id varchar(150) not null,
  external_household_id uuid not null,
  household_id uuid not null references rsvp.households(id),
  member_count integer not null check (member_count > 0),
  member_set_hash varchar(32) not null check (member_set_hash ~ '^[0-9a-f]{32}$'),
  actor_id varchar(255) not null check (length(btrim(actor_id)) > 0),
  created_at timestamptz not null default now(),
  unique (source_id, external_household_id),
  foreign key (source_id, external_household_id, household_id)
    references rsvp.guest_sync_households(source_id, external_household_id, household_id)
);

-- The caller must provide an exact, independently reviewed roster. The
-- function never joins households by label and never changes RSVP state.
create function rsvp.reconcile_guest_sync_household(
  target_source text,
  external_household uuid,
  target_household uuid,
  approved_guest_ids uuid[]
) returns integer language plpgsql security definer set search_path = pg_catalog, rsvp as $$
declare
  current_mode text;
  actual_ids uuid[];
  approved_ids uuid[];
  member_count integer;
  set_hash text;
  existing_mapping rsvp.guest_sync_households%rowtype;
begin
  if target_source is null or length(btrim(target_source))=0 or length(target_source)>150
    or external_household is null or target_household is null
    or approved_guest_ids is null or cardinality(approved_guest_ids)=0
    then raise exception 'INVALID_RECONCILIATION_REQUEST'; end if;
  if cardinality(approved_guest_ids)<>(select count(distinct guest_id) from unnest(approved_guest_ids) as ids(guest_id))
    then raise exception 'DUPLICATE_APPROVED_GUEST'; end if;

  perform set_config('lock_timeout','5s',true);
  perform pg_advisory_xact_lock(791203,1);
  lock table rsvp.households,rsvp.guest_sync_members,rsvp.guest_sync_sources,
    rsvp.guest_sync_households,rsvp.guest_sync_exclusions in share row exclusive mode;
  select mode into current_mode from rsvp.guest_sync_sources where source_id=target_source for update;
  if current_mode is distinct from 'legacy' then raise exception 'SOURCE_NOT_LEGACY'; end if;
  if not exists(select 1 from rsvp.guest_sync_exclusions where household_id=target_household and active=false)
    then raise exception 'EXCLUDED_OR_UNKNOWN_HOUSEHOLD'; end if;
  select * into existing_mapping from rsvp.guest_sync_households
    where source_id=target_source and external_household_id=external_household for update;
  if found then
    if existing_mapping.household_id=target_household then
      select array_agg(external_id order by external_id) into actual_ids from rsvp.guest_sync_members
        where source_id=target_source and household_id=target_household;
      approved_ids:=array(select guest_id from unnest(approved_guest_ids) as ids(guest_id) order by guest_id);
      if actual_ids is not distinct from approved_ids then return cardinality(actual_ids); end if;
    end if;
    raise exception 'HOUSEHOLD_MAPPING_EXISTS';
  end if;

  select array_agg(external_id order by external_id) into actual_ids from rsvp.guest_sync_members
    where source_id=target_source and household_id=target_household;
  if actual_ids is null or cardinality(actual_ids)=0 then raise exception 'NO_MAPPED_GUESTS'; end if;
  approved_ids:=array(select guest_id from unnest(approved_guest_ids) as ids(guest_id) order by guest_id);
  if actual_ids is distinct from approved_ids then raise exception 'ROSTER_MISMATCH'; end if;
  member_count:=cardinality(actual_ids);
  set_hash:=md5(array_to_string(actual_ids,','));

  insert into rsvp.guest_sync_households(source_id,external_household_id,household_id)
    values(target_source,external_household,target_household);
  update rsvp.guest_sync_members set external_household_id=external_household
    where source_id=target_source and household_id=target_household;
  insert into rsvp.guest_sync_household_mapping_events(
    source_id,external_household_id,household_id,member_count,member_set_hash,actor_id
  ) values(target_source,external_household,target_household,member_count,set_hash,session_user::text);
  return member_count;
end
$$;

revoke all on rsvp.guest_sync_household_mapping_events from public;
revoke all on sequence rsvp.guest_sync_household_mapping_events_id_seq from public;
revoke all on function rsvp.reconcile_guest_sync_household(text,uuid,uuid,uuid[]) from public;
do $$ begin
  if exists(select 1 from pg_roles where rolname='site_love_sync') then
    revoke all on rsvp.guest_sync_household_mapping_events from site_love_sync;
    revoke all on sequence rsvp.guest_sync_household_mapping_events_id_seq from site_love_sync;
    revoke all on function rsvp.reconcile_guest_sync_household(text,uuid,uuid,uuid[]) from site_love_sync;
  end if;
  if exists(select 1 from pg_roles where rolname='site_love_app') then
    revoke all on rsvp.guest_sync_household_mapping_events from site_love_app;
    revoke all on sequence rsvp.guest_sync_household_mapping_events_id_seq from site_love_app;
    revoke all on function rsvp.reconcile_guest_sync_household(text,uuid,uuid,uuid[]) from site_love_app;
  end if;
end $$;
commit;
