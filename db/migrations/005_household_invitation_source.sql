begin;

alter table rsvp.households
  add column if not exists invited_by varchar(8);

with household_sources as (
  select
    household_id,
    case
      when count(*) filter (where invited_by = 'bride') = count(*) then 'bride'
      when count(*) filter (where invited_by = 'groom') = count(*) then 'groom'
      when count(*) filter (where invited_by = 'both') = count(*) then 'both'
      else 'both'
    end as invited_by
  from rsvp.invitees
  group by household_id
)
update rsvp.households as household
set invited_by = household_sources.invited_by
from household_sources
where household_sources.household_id = household.id;

update rsvp.households
set invited_by = 'both'
where invited_by is null;

alter table rsvp.households
  alter column invited_by set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_households_invited_by_check'
      and conrelid = 'rsvp.households'::regclass
  ) then
    alter table rsvp.households
      add constraint rsvp_households_invited_by_check
      check (invited_by in ('bride', 'groom', 'both'));
  end if;
end
$$;

comment on column rsvp.households.invited_by is
  'Private planning classification for the whole invitation: bride, groom, or both.';

alter table rsvp.invitees
  drop column if exists invited_by;

commit;
