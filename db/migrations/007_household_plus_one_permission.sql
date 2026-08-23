begin;

alter table rsvp.households
  add column if not exists allow_plus_one boolean not null default false;

comment on column rsvp.households.allow_plus_one is
  'Whether this household may add one unnamed companion not already listed among invitees.';

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'site_love_app') then
    execute 'grant select (allow_plus_one) on rsvp.households to site_love_app';
  end if;
end
$$;

commit;
