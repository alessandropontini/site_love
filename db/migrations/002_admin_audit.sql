begin;

create table if not exists rsvp.admin_events (
  id bigint generated always as identity primary key,
  actor_id varchar(255) not null,
  event_type varchar(40) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rsvp_admin_events_created_idx
  on rsvp.admin_events (created_at desc);

revoke all on rsvp.admin_events from public;
revoke all on sequence rsvp.admin_events_id_seq from public;

commit;
