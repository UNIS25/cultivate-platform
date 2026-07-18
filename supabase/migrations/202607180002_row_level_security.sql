begin;

create function public.current_user_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id from public.users where id = auth.uid();
$$;

create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'platform_admin', false);
$$;

create function public.is_organisation_member(target_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_platform_admin()
    or (
      auth.uid() is not null
      and public.current_user_organisation_id() = target_organisation_id
    ),
    false
  );
$$;

create function public.can_manage_organisation(target_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_platform_admin()
    or (
      public.current_user_organisation_id() = target_organisation_id
      and public.current_user_role() in ('coordinator', 'organisation_admin')
    ),
    false
  );
$$;

create function public.listing_donor_organisation(target_listing_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select donor_organisation_id from public.surplus_listings where id = target_listing_id;
$$;

create function public.location_belongs_to_organisation(target_location_id uuid, target_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organisation_locations
     where id = target_location_id
       and organisation_id = target_organisation_id
  );
$$;

create function public.can_access_collection(target_collection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_platform_admin()
    or exists (
      select 1
        from public.collections
       where id = target_collection_id
         and (
           donor_organisation_id = public.current_user_organisation_id()
           or recipient_organisation_id = public.current_user_organisation_id()
         )
    ),
    false
  );
$$;

revoke all on function public.current_user_organisation_id() from public;
revoke all on function public.current_user_role() from public;
revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_organisation_member(uuid) from public;
revoke all on function public.can_manage_organisation(uuid) from public;
revoke all on function public.listing_donor_organisation(uuid) from public;
revoke all on function public.location_belongs_to_organisation(uuid, uuid) from public;
revoke all on function public.can_access_collection(uuid) from public;

grant execute on function public.current_user_organisation_id() to anon, authenticated;
grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_platform_admin() to anon, authenticated;
grant execute on function public.is_organisation_member(uuid) to anon, authenticated;
grant execute on function public.can_manage_organisation(uuid) to authenticated;
grant execute on function public.listing_donor_organisation(uuid) to authenticated;
grant execute on function public.location_belongs_to_organisation(uuid, uuid) to authenticated;
grant execute on function public.can_access_collection(uuid) to authenticated;

alter table public.food_categories enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_locations enable row level security;
alter table public.organisation_food_categories enable row level security;
alter table public.users enable row level security;
alter table public.surplus_listings enable row level security;
alter table public.matches enable row level security;
alter table public.collections enable row level security;
alter table public.impact_records enable row level security;
alter table public.governance_resources enable row level security;
alter table public.engagement_resources enable row level security;

create policy food_categories_public_read
  on public.food_categories for select
  to anon, authenticated
  using (active or public.is_platform_admin());

create policy food_categories_platform_manage
  on public.food_categories for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy organisations_public_read
  on public.organisations for select
  to anon, authenticated
  using (public_profile and status <> 'inactive');

create policy organisations_member_read_private
  on public.organisations for select
  to authenticated
  using (public.is_organisation_member(id));

create policy organisations_platform_insert
  on public.organisations for insert
  to authenticated
  with check (public.is_platform_admin());

create policy organisations_admin_update
  on public.organisations for update
  to authenticated
  using (public.can_manage_organisation(id))
  with check (public.can_manage_organisation(id));

create policy organisations_platform_delete
  on public.organisations for delete
  to authenticated
  using (public.is_platform_admin());

create policy organisation_locations_public_read
  on public.organisation_locations for select
  to anon, authenticated
  using (
    visibility in ('public', 'generalised')
    and exists (
      select 1 from public.organisations
       where organisations.id = organisation_locations.organisation_id
         and organisations.public_profile
         and organisations.status <> 'inactive'
    )
  );

create policy organisation_locations_member_read_private
  on public.organisation_locations for select
  to authenticated
  using (public.is_organisation_member(organisation_id));

create policy organisation_locations_admin_insert
  on public.organisation_locations for insert
  to authenticated
  with check (public.can_manage_organisation(organisation_id));

create policy organisation_locations_admin_update
  on public.organisation_locations for update
  to authenticated
  using (public.can_manage_organisation(organisation_id))
  with check (public.can_manage_organisation(organisation_id));

create policy organisation_locations_admin_delete
  on public.organisation_locations for delete
  to authenticated
  using (public.can_manage_organisation(organisation_id));

create policy organisation_food_categories_public_read
  on public.organisation_food_categories for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.organisations
       where organisations.id = organisation_food_categories.organisation_id
         and organisations.public_profile
         and organisations.status <> 'inactive'
    )
  );

create policy organisation_food_categories_admin_insert
  on public.organisation_food_categories for insert
  to authenticated
  with check (public.can_manage_organisation(organisation_id));

create policy organisation_food_categories_admin_update
  on public.organisation_food_categories for update
  to authenticated
  using (public.can_manage_organisation(organisation_id))
  with check (public.can_manage_organisation(organisation_id));

create policy organisation_food_categories_admin_delete
  on public.organisation_food_categories for delete
  to authenticated
  using (public.can_manage_organisation(organisation_id));

create policy users_self_or_colleague_read
  on public.users for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_platform_admin()
    or (
      organisation_id is not null
      and organisation_id = public.current_user_organisation_id()
    )
  );

create policy users_self_update
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy surplus_listings_public_read
  on public.surplus_listings for select
  to anon, authenticated
  using (
    status in ('available', 'reserved', 'collected')
    and exists (
      select 1 from public.organisations
       where organisations.id = surplus_listings.donor_organisation_id
         and organisations.public_profile
         and organisations.status <> 'inactive'
    )
  );

create policy surplus_listings_participant_read
  on public.surplus_listings for select
  to authenticated
  using (
    public.is_organisation_member(donor_organisation_id)
    or (
      recipient_organisation_id is not null
      and public.is_organisation_member(recipient_organisation_id)
    )
  );

create policy surplus_listings_donor_insert
  on public.surplus_listings for insert
  to authenticated
  with check (
    public.can_manage_organisation(donor_organisation_id)
    and created_by = auth.uid()
    and public.location_belongs_to_organisation(location_id, donor_organisation_id)
  );

create policy surplus_listings_donor_update
  on public.surplus_listings for update
  to authenticated
  using (public.can_manage_organisation(donor_organisation_id))
  with check (
    public.can_manage_organisation(donor_organisation_id)
    and public.location_belongs_to_organisation(location_id, donor_organisation_id)
  );

create policy surplus_listings_donor_delete
  on public.surplus_listings for delete
  to authenticated
  using (
    public.can_manage_organisation(donor_organisation_id)
    and status in ('draft', 'cancelled')
  );

create policy matches_participant_read
  on public.matches for select
  to authenticated
  using (
    public.is_organisation_member(recipient_organisation_id)
    or public.is_organisation_member(public.listing_donor_organisation(listing_id))
  );

create policy matches_donor_insert
  on public.matches for insert
  to authenticated
  with check (
    public.can_manage_organisation(public.listing_donor_organisation(listing_id))
    and created_by = auth.uid()
  );

create policy matches_participant_update
  on public.matches for update
  to authenticated
  using (
    public.can_manage_organisation(recipient_organisation_id)
    or public.can_manage_organisation(public.listing_donor_organisation(listing_id))
  )
  with check (
    public.can_manage_organisation(recipient_organisation_id)
    or public.can_manage_organisation(public.listing_donor_organisation(listing_id))
  );

create policy matches_platform_delete
  on public.matches for delete
  to authenticated
  using (public.is_platform_admin());

create policy collections_public_completed_read
  on public.collections for select
  to anon, authenticated
  using (is_public and status = 'completed');

create policy collections_participant_read
  on public.collections for select
  to authenticated
  using (
    public.is_organisation_member(donor_organisation_id)
    or public.is_organisation_member(recipient_organisation_id)
  );

create policy collections_participant_insert
  on public.collections for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.can_manage_organisation(donor_organisation_id)
      or public.can_manage_organisation(recipient_organisation_id)
    )
  );

create policy collections_participant_update
  on public.collections for update
  to authenticated
  using (
    public.can_manage_organisation(donor_organisation_id)
    or public.can_manage_organisation(recipient_organisation_id)
  )
  with check (
    public.can_manage_organisation(donor_organisation_id)
    or public.can_manage_organisation(recipient_organisation_id)
  );

create policy collections_platform_delete
  on public.collections for delete
  to authenticated
  using (public.is_platform_admin());

create policy impact_records_public_read
  on public.impact_records for select
  to anon, authenticated
  using (is_public);

create policy impact_records_participant_read
  on public.impact_records for select
  to authenticated
  using (public.can_access_collection(collection_id));

create policy impact_records_platform_insert
  on public.impact_records for insert
  to authenticated
  with check (public.is_platform_admin() and created_by = auth.uid());

create policy governance_resources_public_read
  on public.governance_resources for select
  to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy governance_resources_platform_manage
  on public.governance_resources for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy engagement_resources_public_read
  on public.engagement_resources for select
  to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy engagement_resources_platform_manage
  on public.engagement_resources for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create function public.protect_match_scoring_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_platform_admin() then
    if new.listing_id is distinct from old.listing_id
      or new.recipient_organisation_id is distinct from old.recipient_organisation_id
      or new.score is distinct from old.score
      or new.eligible is distinct from old.eligible
      or new.distance_km is distinct from old.distance_km
      or new.scoring_method is distinct from old.scoring_method
      or new.score_breakdown is distinct from old.score_breakdown
      or new.blockers is distinct from old.blockers
      or new.created_by is distinct from old.created_by then
      raise exception 'Match scoring and ownership fields are immutable';
    end if;
  end if;

  if new.status is distinct from old.status and new.responded_at is null then
    new.responded_at = now();
  end if;

  if auth.uid() is not null
    and not public.is_platform_admin()
    and new.status is distinct from old.status
    and not (
      (old.status = 'recommended' and new.status in ('accepted', 'rejected', 'cancelled'))
      or (old.status = 'accepted' and new.status = 'cancelled')
    ) then
    raise exception 'Invalid match status transition';
  end if;
  return new;
end;
$$;

create trigger matches_protect_scoring_fields
  before update on public.matches
  for each row execute function public.protect_match_scoring_fields();

create function public.protect_collection_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_platform_admin() then
    if new.match_id is distinct from old.match_id
      or new.listing_id is distinct from old.listing_id
      or new.donor_organisation_id is distinct from old.donor_organisation_id
      or new.recipient_organisation_id is distinct from old.recipient_organisation_id
      or new.location_id is distinct from old.location_id
      or new.created_by is distinct from old.created_by then
      raise exception 'Collection parties and ownership fields are immutable';
    end if;

    if old.status = 'completed' and new is distinct from old then
      raise exception 'Completed collections are immutable';
    end if;

    if new.status is distinct from old.status
      and not (
        (old.status = 'scheduled' and new.status in ('in_progress', 'completed', 'cancelled', 'failed'))
        or (old.status = 'in_progress' and new.status in ('completed', 'cancelled', 'failed'))
      ) then
      raise exception 'Invalid collection status transition';
    end if;
  end if;
  return new;
end;
$$;

create trigger collections_protect_identity
  before update on public.collections
  for each row execute function public.protect_collection_identity();

revoke all on all tables in schema public from anon, authenticated;

grant select on public.food_categories to anon, authenticated;
grant select on public.organisations to anon, authenticated;
grant select on public.organisation_locations to anon, authenticated;
grant select on public.organisation_food_categories to anon, authenticated;
grant select on public.surplus_listings to anon, authenticated;
grant select on public.collections to anon, authenticated;
grant select on public.impact_records to anon, authenticated;
grant select on public.governance_resources to anon, authenticated;
grant select on public.engagement_resources to anon, authenticated;

grant select on public.users to authenticated;
grant update (full_name, avatar_url) on public.users to authenticated;
grant insert, update, delete on public.food_categories to authenticated;
grant insert, update, delete on public.organisations to authenticated;
grant insert, update, delete on public.organisation_locations to authenticated;
grant insert, update, delete on public.organisation_food_categories to authenticated;
grant insert, update, delete on public.surplus_listings to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant insert, update, delete on public.collections to authenticated;
grant insert on public.impact_records to authenticated;
grant insert, update, delete on public.governance_resources to authenticated;
grant insert, update, delete on public.engagement_resources to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

commit;
