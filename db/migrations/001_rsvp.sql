begin;

create extension if not exists pgcrypto;
create schema if not exists rsvp;

create table if not exists rsvp.households (
  id uuid primary key default gen_random_uuid(),
  display_name varchar(120) not null,
  token_hash char(64) not null unique,
  preferred_locale varchar(2) not null default 'it'
    check (preferred_locale in ('it', 'en')),
  status varchar(16) not null default 'active'
    check (status in ('active', 'closed', 'disabled')),
  deadline timestamptz,
  response_version integer not null default 0 check (response_version >= 0),
  submission_window_started_at timestamptz,
  submission_count smallint not null default 0
    constraint rsvp_households_submission_count_check
    check (submission_count between 0 and 10),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (token_hash ~ '^[0-9a-f]{64}$')
);

create table if not exists rsvp.invitees (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references rsvp.households(id) on delete cascade,
  display_name varchar(120) not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, id)
);

create index if not exists rsvp_invitees_household_idx
  on rsvp.invitees (household_id, sort_order, id);

create table if not exists rsvp.responses (
  household_id uuid not null,
  invitee_id uuid not null,
  attendance varchar(8) not null
    check (attendance in ('yes', 'no')),
  meal_preference varchar(20) not null
    check (
      meal_preference in (
        'standard',
        'vegetarian',
        'vegan',
        'children',
        'not_needed'
      )
    ),
  updated_at timestamptz not null default now(),
  primary key (household_id, invitee_id),
  foreign key (household_id, invitee_id)
    references rsvp.invitees(household_id, id)
    on delete cascade
);

create table if not exists rsvp.audit_events (
  id bigint generated always as identity primary key,
  household_id uuid not null references rsvp.households(id) on delete cascade,
  event_type varchar(40) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rsvp_audit_events_household_created_idx
  on rsvp.audit_events (household_id, created_at desc);

revoke all on schema rsvp from public;
revoke all on all tables in schema rsvp from public;
revoke all on all sequences in schema rsvp from public;

commit;
