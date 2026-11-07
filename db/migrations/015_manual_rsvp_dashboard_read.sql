begin;

-- Expose only operational RSVP history fields to the Clerk-protected admin
-- server adapter. Neither runtime database role receives table SELECT access.
create function rsvp.manual_response_dashboard_events()
returns table (
  household_id uuid,
  actor_id varchar(255),
  provenance text,
  recording_reason text,
  revision integer,
  created_at timestamptz
)
language sql stable security definer set search_path=pg_catalog,rsvp as $$
  select event.household_id, event.actor_id, event.provenance,
         event.recording_reason, event.revision, event.created_at
  from rsvp.manual_response_events event
  order by event.created_at desc, event.household_id, event.revision desc
$$;

revoke all on rsvp.manual_response_events from public;
revoke all on function rsvp.manual_response_dashboard_events() from public;

do $$ begin
  if exists(select 1 from pg_roles where rolname='site_love_sync') then
    revoke all on rsvp.manual_response_events from site_love_sync;
    grant execute on function rsvp.manual_response_dashboard_events() to site_love_sync;
  end if;
  if exists(select 1 from pg_roles where rolname='site_love_app') then
    revoke all on rsvp.manual_response_events from site_love_app;
    revoke all on function rsvp.manual_response_dashboard_events() from site_love_app;
  end if;
end $$;

commit;
