begin;

alter table rsvp.households
  add column if not exists submission_window_started_at timestamptz;

alter table rsvp.households
  add column if not exists submission_count smallint not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_households_submission_count_check'
      and conrelid = 'rsvp.households'::regclass
  ) then
    alter table rsvp.households
      add constraint rsvp_households_submission_count_check
      check (submission_count between 0 and 10);
  end if;
end
$$;

commit;
