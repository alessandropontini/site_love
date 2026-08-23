begin;

alter table rsvp.households
  add column if not exists contact_email varchar(254);

alter table rsvp.households
  add column if not exists has_children boolean not null default false;

alter table rsvp.responses
  alter column meal_preference drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_responses_attendance_meal_phase_check'
      and conrelid = 'rsvp.responses'::regclass
  ) then
    alter table rsvp.responses
      add constraint rsvp_responses_attendance_meal_phase_check
      check (
        (attendance = 'no' and meal_preference = 'not_needed')
        or
        (attendance = 'yes' and meal_preference is distinct from 'not_needed')
      );
  end if;
end
$$;

create table if not exists rsvp.additional_guests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references rsvp.households(id) on delete cascade,
  guest_type varchar(16) not null
    check (guest_type = 'plus_one'),
  first_name varchar(80) not null,
  last_name varchar(80) not null,
  meal_preference varchar(20)
    check (
      meal_preference in (
        'standard',
        'vegetarian',
        'vegan',
        'children'
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, id)
);

create unique index if not exists rsvp_additional_guests_one_plus_one_idx
  on rsvp.additional_guests (household_id)
  where guest_type = 'plus_one';

create index if not exists rsvp_additional_guests_household_idx
  on rsvp.additional_guests (household_id, guest_type, created_at, id);

revoke all on rsvp.additional_guests from public;

comment on column rsvp.households.contact_email is
  'Household contact used only for RSVP confirmations and operational reminders.';

comment on column rsvp.households.has_children is
  'Minimal yes/no indication that children will attend; no child names or ages are stored.';

comment on table rsvp.additional_guests is
  'One optional named plus-one supplied by the household RSVP contact.';

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'site_love_app') then
    execute 'grant update (contact_email, has_children) on rsvp.households to site_love_app';
    execute 'grant select, insert, update, delete on rsvp.additional_guests to site_love_app';
  end if;
end
$$;

commit;
