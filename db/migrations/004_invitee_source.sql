begin;

alter table rsvp.invitees
  add column if not exists invited_by varchar(8) not null default 'both';

alter table rsvp.invitees
  alter column invited_by drop default;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_invitees_invited_by_check'
      and conrelid = 'rsvp.invitees'::regclass
  ) then
    alter table rsvp.invitees
      add constraint rsvp_invitees_invited_by_check
      check (invited_by in ('bride', 'groom', 'both'));
  end if;
end
$$;

comment on column rsvp.invitees.invited_by is
  'Private planning classification: bride, groom, or both.';

commit;
