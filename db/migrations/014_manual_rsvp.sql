begin;
create table rsvp.manual_response_events (
 id uuid primary key,
 household_id uuid not null references rsvp.households(id),
 actor_id varchar(255) not null check(length(btrim(actor_id)) between 1 and 255),
 provenance text not null check(provenance in ('phone','message','paper','in_person')),
 recording_reason text not null check(recording_reason in ('initial_offsite_response','correction')),
 revision integer not null check(revision > 0),
 request_hash varchar(64) not null check(request_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now()
);
create function rsvp.admin_household(target uuid) returns jsonb
language sql stable security definer set search_path=pg_catalog,rsvp as $$
 select jsonb_build_object('id',h.id,'householdName',h.display_name,'contactEmail',h.contact_email,
 'allowPlusOne',h.allow_plus_one,'locale',h.preferred_locale,'revision',h.response_version,'hasChildren',h.has_children,
 'invitees',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'displayName',i.display_name,'attendance',r.attendance,'mealPreference',r.meal_preference) order by i.sort_order,i.id)
 from rsvp.invitees i left join rsvp.responses r on r.invitee_id=i.id and r.household_id=i.household_id where i.household_id=h.id),'[]'::jsonb),
 'plusOne',(select jsonb_build_object('id',g.id,'firstName',g.first_name,'lastName',g.last_name,'mealPreference',g.meal_preference) from rsvp.additional_guests g where g.household_id=h.id and g.guest_type='plus_one'))
 from rsvp.households h where h.id=target
$$;
create function rsvp.record_manual_response(request jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,rsvp as $$
declare
 previous rsvp.manual_response_events%rowtype;
 current_household rsvp.households%rowtype;
 p_household uuid; p_revision integer; p_answers jsonb; p_email text; p_extras jsonb; p_children boolean; p_privacy text;
 outcome record; submission jsonb;
begin
 if current_setting('transaction_isolation') <> 'read committed' then raise exception 'MANUAL_READ_COMMITTED_REQUIRED'; end if;
 if request is null or jsonb_typeof(request)<>'object' then raise exception 'MANUAL_INVALID'; end if;
 if (select count(*) from jsonb_object_keys(request))<>7 or
 not request ?& array['id','household','actor','provenance','recordingReason','requestHash','submission'] or
 exists(select 1 from jsonb_each(request) field where field.key<>'submission' and jsonb_typeof(field.value)<>'string') or
 length(btrim(request->>'actor')) not between 1 and 255 or request->>'provenance' not in ('phone','message','paper','in_person') or
 request->>'recordingReason' not in ('initial_offsite_response','correction') or
 request->>'requestHash' !~ '^[0-9a-f]{64}$' then raise exception 'MANUAL_INVALID'; end if;
 submission:=request->'submission';
 if jsonb_typeof(submission)<>'object' or (select count(*) from jsonb_object_keys(submission))<>8 or
 not submission ?& array['revision','locale','contactEmail','answers','plusOne','hasChildren','privacyNoticeVersion','confirmed'] or
 submission->>'confirmed' is distinct from 'true' or jsonb_typeof(submission->'confirmed')<>'boolean' or
 jsonb_typeof(submission->'revision')<>'number' or submission->>'revision' !~ '^(0|[1-9][0-9]{0,8})$' or
 submission->>'locale' not in ('it','en') or jsonb_typeof(submission->'hasChildren')<>'boolean' or
 jsonb_typeof(submission->'contactEmail')<>'string' or length(submission->>'contactEmail') not between 3 and 254 or
 submission->>'contactEmail' !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or
 jsonb_typeof(submission->'privacyNoticeVersion')<>'string' or length(submission->>'privacyNoticeVersion') not between 1 and 100 or
 jsonb_typeof(submission->'answers')<>'array' then raise exception 'MANUAL_INVALID'; end if;
 if jsonb_array_length(submission->'answers') not between 1 and 25 then raise exception 'MANUAL_INVALID'; end if;
 if exists(select 1 from jsonb_array_elements(submission->'answers') a where jsonb_typeof(a)<>'object' or
  (select count(*) from jsonb_object_keys(a))<>3 or not a ?& array['inviteeId','attendance','mealPreference'] or
  a->>'attendance' not in ('yes','no') or jsonb_typeof(a->'attendance')<>'string' or jsonb_typeof(a->'inviteeId')<>'string' or
  (a->>'attendance'='no' and a->>'mealPreference' is distinct from 'not_needed') or
  (a->>'attendance'='yes' and a->>'mealPreference'='not_needed')) then raise exception 'MANUAL_INVALID'; end if;
 if (select count(distinct a->>'inviteeId') from jsonb_array_elements(submission->'answers') a)<>jsonb_array_length(submission->'answers') then raise exception 'MANUAL_DUPLICATE_INVITEE'; end if;
 if jsonb_typeof(submission->'plusOne') not in ('null','object') then raise exception 'MANUAL_INVALID'; end if;
 if jsonb_typeof(submission->'plusOne')='object' then
  if (select count(*) from jsonb_object_keys(submission->'plusOne'))<>4 or not (submission->'plusOne') ?& array['id','firstName','lastName','mealPreference'] or
   jsonb_typeof(submission->'plusOne'->'firstName')<>'string' or jsonb_typeof(submission->'plusOne'->'lastName')<>'string' or
   length(btrim(submission->'plusOne'->>'firstName')) not between 1 and 80 or length(btrim(submission->'plusOne'->>'lastName')) not between 1 and 80
   then raise exception 'MANUAL_INVALID'; end if;
 end if;
 if not exists(select 1 from jsonb_array_elements(submission->'answers') a where a->>'attendance'='yes') and
  ((submission->>'hasChildren')::boolean or jsonb_typeof(submission->'plusOne')<>'null') then raise exception 'MANUAL_INVALID_EXTRAS'; end if;
 p_household:=(request->>'household')::uuid; p_revision:=(submission->>'revision')::integer;
 perform set_config('lock_timeout','5s',true);
 perform set_config('statement_timeout','15s',true);
 perform pg_advisory_xact_lock(791203,1);
 select * into previous from rsvp.manual_response_events where id=(request->>'id')::uuid;
 if found then
  if previous.request_hash<>request->>'requestHash' or previous.household_id<>p_household or previous.actor_id<>request->>'actor' or previous.provenance<>request->>'provenance' or previous.recording_reason<>request->>'recordingReason' then raise exception 'MANUAL_EVENT_REUSED'; end if;
  return jsonb_build_object('revision',previous.revision,'replayed',true);
 end if;
 select * into current_household from rsvp.households where id=p_household for update;
 if not found then raise exception 'MANUAL_NOT_FOUND'; end if;
 if current_household.response_version<>p_revision then raise exception 'MANUAL_VERSION_CONFLICT'; end if;
 if (request->>'recordingReason'='initial_offsite_response' and
     (current_household.response_version<>0 or exists(select 1 from rsvp.responses where household_id=p_household))) or
    (request->>'recordingReason'='correction' and
     (current_household.response_version=0 or not exists(select 1 from rsvp.responses where household_id=p_household))) then
   raise exception 'MANUAL_REASON_STATE_MISMATCH';
 end if;
 p_email:=submission->>'contactEmail';p_children:=(submission->>'hasChildren')::boolean;p_privacy:=submission->>'privacyNoticeVersion';
 select jsonb_agg(jsonb_build_object('invitee_id',a->>'inviteeId','attendance',a->>'attendance','meal_preference',a->'mealPreference')) into p_answers from jsonb_array_elements(submission->'answers') a;
 p_extras:=case when jsonb_typeof(submission->'plusOne')='null' then '[]'::jsonb else jsonb_build_array(jsonb_build_object(
 'id',submission->'plusOne'->'id','guest_type','plus_one','first_name',submission->'plusOne'->>'firstName','last_name',submission->'plusOne'->>'lastName','meal_preference',submission->'plusOne'->'mealPreference')) end;
with incoming as (
        select *
        from jsonb_to_recordset(p_answers::jsonb) as answer(
          invitee_id uuid,
          attendance text,
          meal_preference text
        )
      ),
      eligible as (
        select incoming.*
        from incoming
        join rsvp.invitees
          on invitees.id = incoming.invitee_id
         and invitees.household_id = p_household
      ),
      classified as (
        select
          eligible.*,
          responses.invitee_id is null
            or responses.attendance is distinct from eligible.attendance
            or responses.meal_preference is distinct from eligible.meal_preference
            as should_write,
          responses.invitee_id is not null
            and (
              responses.attendance is distinct from eligible.attendance
              or responses.meal_preference is distinct from eligible.meal_preference
            ) as changed
        from eligible
        left join rsvp.responses
          on responses.household_id = p_household
         and responses.invitee_id = eligible.invitee_id
      ),
      incoming_extras as (
        select *
        from jsonb_to_recordset(p_extras::jsonb) as guest(
          id uuid,
          guest_type text,
          first_name text,
          last_name text,
          meal_preference text
        )
      ),
      existing_extras as (
        select *
        from rsvp.additional_guests
        where household_id = p_household
      ),
      submission_state as (
        select
          (
            (select count(*) from incoming) = (select count(*) from eligible)
            and (select count(*) from eligible) = (
              select count(*) from rsvp.invitees where household_id = p_household
            )
            and not exists (
              select 1
              from incoming_extras
              where incoming_extras.id is not null
                and not exists (
                  select 1
                  from existing_extras
                  where existing_extras.id = incoming_extras.id
                    and existing_extras.guest_type = incoming_extras.guest_type
                )
            )
            and (
              not exists (select 1 from incoming_extras)
              or exists (
                select 1
                from rsvp.households
                where id = p_household
                  and allow_plus_one
              )
            )
          ) as valid,
          (
            exists (select 1 from classified where should_write)
            or exists (
              select 1
              from rsvp.households
              where id = p_household
                and (
                  contact_email is distinct from lower(p_email)
                  or has_children is distinct from p_children
                )
            )
            or exists (select 1 from incoming_extras where id is null)
            or (select count(*) from existing_extras)
              <> (select count(*) from incoming_extras)
            or exists (
              select 1
              from existing_extras
              left join incoming_extras using (id)
              where incoming_extras.id is null
                or existing_extras.guest_type is distinct from incoming_extras.guest_type
                or existing_extras.first_name is distinct from incoming_extras.first_name
                or existing_extras.last_name is distinct from incoming_extras.last_name
                or existing_extras.meal_preference is distinct from incoming_extras.meal_preference
            )
            or not exists (
              select 1
              from rsvp.audit_events
              where household_id = p_household
                and event_type = 'response_updated'
                and metadata ->> 'privacy_notice_version' = p_privacy::text
            )
          ) as should_write
      ),
      bumped as (
        update rsvp.households
        set contact_email = lower(p_email),
            has_children = p_children,
            response_version = response_version + 1,
            updated_at = now(),
            submission_window_started_at = case
              when submission_window_started_at is null
                or submission_window_started_at <= now() - interval '1 hour'
              then now()
              else submission_window_started_at
            end,
            submission_count = case
              when submission_window_started_at is null
                or submission_window_started_at <= now() - interval '1 hour'
              then 1
              else submission_count + 1
            end
        where id = p_household
          and response_version = p_revision



          and (
            submission_window_started_at is null
            or submission_window_started_at <= now() - interval '1 hour'
            or submission_count < 10
          )
          and (select valid and should_write from submission_state)
        returning id, response_version
      ),
      deleted_extras as (
        delete from rsvp.additional_guests
        using bumped
        where additional_guests.household_id = bumped.id
          and not exists (
            select 1
            from incoming_extras
            where incoming_extras.id = additional_guests.id
          )
        returning additional_guests.id
      ),
      updated_extras as (
        update rsvp.additional_guests
        set first_name = incoming_extras.first_name,
            last_name = incoming_extras.last_name,
            meal_preference = incoming_extras.meal_preference,
            updated_at = now()
        from incoming_extras, bumped
        where additional_guests.household_id = bumped.id
          and additional_guests.id = incoming_extras.id
          and additional_guests.guest_type = incoming_extras.guest_type
          and (
            additional_guests.first_name is distinct from incoming_extras.first_name
            or additional_guests.last_name is distinct from incoming_extras.last_name
            or additional_guests.meal_preference is distinct from incoming_extras.meal_preference
          )
        returning additional_guests.id
      ),
      inserted_extras as (
        insert into rsvp.additional_guests (
          household_id,
          guest_type,
          first_name,
          last_name,
          meal_preference,
          updated_at
        )
        select
          bumped.id,
          incoming_extras.guest_type,
          incoming_extras.first_name,
          incoming_extras.last_name,
          incoming_extras.meal_preference,
          now()
        from incoming_extras
        join bumped on true
        where incoming_extras.id is null
        returning id
      ),
      upserted as (
        insert into rsvp.responses (
          household_id,
          invitee_id,
          attendance,
          meal_preference,
          updated_at
        )
        select
          bumped.id,
          classified.invitee_id,
          classified.attendance,
          classified.meal_preference,
          now()
        from classified
        join bumped on true
        where classified.should_write
        on conflict (household_id, invitee_id) do update
          set attendance = excluded.attendance,
              meal_preference = excluded.meal_preference,
              updated_at = excluded.updated_at
        returning invitee_id
      ),
      audited as (
        insert into rsvp.audit_events (
          household_id,
          event_type,
          metadata
        )
        select
          bumped.id,
          'response_updated',
          jsonb_build_object(
            'revision', bumped.response_version,
            'invitee_count', (select count(*) from eligible),
            'written_invitee_count', (select count(*) from upserted),
            'changed_invitee_count', (
              select count(*) from classified where changed
            ),
            'additional_guest_count', (select count(*) from incoming_extras),
            'additional_guest_inserted_count', (select count(*) from inserted_extras),
            'additional_guest_updated_count', (select count(*) from updated_extras),
            'additional_guest_removed_count', (select count(*) from deleted_extras),
            'privacy_notice_version', p_privacy::text,
            'source', request->>'provenance', 'actor', request->>'actor',
            'recording_reason', request->>'recordingReason', 'operation_id', request->>'id'
          )
        from bumped
        returning id
      )
      select
        (select response_version::int from bumped) as response_version,
        (
          select count(*)::int
          from eligible
          join bumped on true
        ) as saved_count,
        (
          (select valid and not should_write from submission_state)
          and exists (
            select 1
            from rsvp.households
            where id = p_household
              and response_version = p_revision



          )
        ) as unchanged,
        case
          when exists (select 1 from bumped) then false
          else exists (
            select 1
            from rsvp.households
            where id = p_household
              and submission_window_started_at > now() - interval '1 hour'
              and submission_count >= 10
          )
        end as rate_limited into outcome;
 if outcome.unchanged then raise exception 'MANUAL_UNCHANGED'; end if;
 if outcome.response_version is null then raise exception 'MANUAL_INVALID_OR_RATE_LIMITED'; end if;
 insert into rsvp.manual_response_events(id,household_id,actor_id,provenance,recording_reason,revision,request_hash)
 values((request->>'id')::uuid,p_household,request->>'actor',request->>'provenance',request->>'recordingReason',outcome.response_version,request->>'requestHash');
 return jsonb_build_object('revision',outcome.response_version,'replayed',false);
end $$;
revoke all on rsvp.manual_response_events from public;
revoke all on function rsvp.admin_household(uuid),rsvp.record_manual_response(jsonb) from public;
do $$ begin
 if exists(select 1 from pg_roles where rolname='site_love_sync') then
  revoke all on rsvp.manual_response_events from site_love_sync;
  grant select on rsvp.manual_response_events to site_love_sync;
  grant execute on function rsvp.admin_household(uuid),rsvp.record_manual_response(jsonb) to site_love_sync;
 end if;
 if exists(select 1 from pg_roles where rolname='site_love_app') then
  revoke all on rsvp.manual_response_events from site_love_app;
  revoke all on function rsvp.admin_household(uuid),rsvp.record_manual_response(jsonb) from site_love_app;
 end if;
end $$;
commit;
