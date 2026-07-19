begin;

create function public.can_access_resource_event(target_resource_event_id uuid)
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
        from public.resource_events resource_event
       where resource_event.id = target_resource_event_id
         and (
           resource_event.organisation_id = public.current_user_organisation_id()
           or resource_event.destination_id = public.current_user_organisation_id()
           or exists (
             select 1
               from public.matches match_record
              where match_record.resource_event_id = resource_event.id
                and match_record.recipient_organisation_id = public.current_user_organisation_id()
           )
         )
    ),
    false
  );
$$;

create function public.can_manage_resource_event(target_resource_event_id uuid)
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
        from public.resource_events resource_event
       where resource_event.id = target_resource_event_id
         and (
           public.can_manage_organisation(resource_event.organisation_id)
           or (
             resource_event.destination_id is not null
             and public.can_manage_organisation(resource_event.destination_id)
           )
         )
    ),
    false
  );
$$;

create function public.get_transparency_statistics(as_of_date date default current_date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with delivered as (
    select
      resource_event.id,
      resource_event.quantity_kg,
      resource_event.material_category,
      resource_event.organisation_id,
      resource_event.destination_id,
      resource_event.delivered_at,
      location.city,
      location.country
    from public.resource_events resource_event
    join public.delivery_confirmations delivery
      on delivery.id = resource_event.delivery_confirmation_id
     and delivery.is_public
    join public.organisation_locations location
      on location.id = resource_event.source_location
    where resource_event.status = 'delivered'
      and resource_event.delivered_at is not null
  ),
  delivered_today as (
    select * from delivered where delivered_at::date = as_of_date
  ),
  city_totals as (
    select city, country, round(sum(quantity_kg), 1) as kilograms, count(*) as completed_events
    from delivered
    where delivered_at >= as_of_date - interval '30 days'
      and delivered_at < as_of_date + interval '1 day'
    group by city, country
    order by sum(quantity_kg) desc, city
  ),
  recent_events as (
    select jsonb_agg(
      jsonb_build_object(
        'id', recent.id,
        'donorAlias', 'Food donor ' || upper(substr(replace(recent.organisation_id::text, '-', ''), 1, 4)),
        'recipientAlias', 'Recipient organisation ' || upper(substr(replace(recent.destination_id::text, '-', ''), 1, 4)),
        'city', recent.city,
        'country', recent.country,
        'category', recent.material_category,
        'quantityKg', recent.quantity_kg,
        'deliveredAt', recent.delivered_at
      ) order by recent.delivered_at desc
    ) as records
    from (
      select * from delivered order by delivered_at desc limit 6
    ) recent
  )
  select jsonb_build_object(
    'asOfDate', as_of_date,
    'kilogramsRedistributedToday', coalesce((select round(sum(quantity_kg), 1) from delivered_today), 0),
    'estimatedMealsToday', coalesce((select round(sum(quantity_kg) * 2.4) from delivered_today), 0),
    'completedPickupsToday', (select count(*) from delivered_today),
    'activeOrganisations', (
      select count(*) from public.organisations
       where status <> 'inactive' and public_profile
    ),
    'estimatedCo2eAvoidedToday', coalesce((select round(sum(quantity_kg) * 2.15, 1) from delivered_today), 0),
    'activityByCity', coalesce((
      select jsonb_agg(jsonb_build_object(
        'city', city,
        'country', country,
        'kilograms', kilograms,
        'completedEvents', completed_events
      )) from city_totals
    ), '[]'::jsonb),
    'recentEvents', coalesce((select records from recent_events), '[]'::jsonb)
  );
$$;

create function public.transition_resource_event(
  target_resource_event_id uuid,
  target_status public.resource_event_status,
  transition_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  transitioned_id uuid;
begin
  if not public.can_manage_resource_event(target_resource_event_id) then
    raise exception 'The current user cannot manage this resource event';
  end if;

  if target_status = 'collected' and not exists (
    select 1 from public.collections
     where resource_event_id = target_resource_event_id and status = 'completed'
  ) then
    raise exception 'Collection confirmation must be recorded before the collected transition';
  end if;

  if target_status = 'delivered' and not exists (
    select 1 from public.delivery_confirmations
     where resource_event_id = target_resource_event_id
  ) then
    raise exception 'Delivery evidence must be recorded before the delivered transition';
  end if;

  perform set_config('cultivate.audit_note', coalesce(transition_note, ''), true);

  update public.resource_events
     set status = target_status,
         matched_at = case when target_status = 'matched' then coalesce(matched_at, now()) else matched_at end,
         accepted_at = case when target_status = 'accepted' then coalesce(accepted_at, now()) else accepted_at end,
         collected_at = case when target_status = 'collected' then coalesce(collected_at, now()) else collected_at end,
         delivered_at = case when target_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end
   where id = target_resource_event_id
  returning id into transitioned_id;

  if transitioned_id is null then
    raise exception 'Resource event not found';
  end if;
  return transitioned_id;
end;
$$;

revoke all on function public.can_access_resource_event(uuid) from public;
revoke all on function public.can_manage_resource_event(uuid) from public;
revoke all on function public.get_transparency_statistics(date) from public;
revoke all on function public.transition_resource_event(uuid, public.resource_event_status, text) from public;

grant execute on function public.can_access_resource_event(uuid) to authenticated;
grant execute on function public.can_manage_resource_event(uuid) to authenticated;
grant execute on function public.get_transparency_statistics(date) to anon, authenticated;
grant execute on function public.transition_resource_event(uuid, public.resource_event_status, text) to authenticated;

alter table public.resource_events enable row level security;
alter table public.delivery_confirmations enable row level security;
alter table public.audit_events enable row level security;

create policy resource_events_participant_read
  on public.resource_events for select
  to authenticated
  using (public.can_access_resource_event(id));

create policy resource_events_donor_insert
  on public.resource_events for insert
  to authenticated
  with check (
    public.can_manage_organisation(organisation_id)
    and created_by = auth.uid()
    and public.location_belongs_to_organisation(source_location, organisation_id)
  );

create policy resource_events_participant_update
  on public.resource_events for update
  to authenticated
  using (public.can_manage_resource_event(id))
  with check (public.can_manage_resource_event(id));

create policy resource_events_platform_delete
  on public.resource_events for delete
  to authenticated
  using (public.is_platform_admin() and status in ('draft', 'cancelled', 'expired'));

create policy delivery_confirmations_participant_read
  on public.delivery_confirmations for select
  to authenticated
  using (public.can_access_resource_event(resource_event_id));

create policy delivery_confirmations_recipient_insert
  on public.delivery_confirmations for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.can_manage_organisation(confirmed_by_organisation_id)
    and public.can_manage_resource_event(resource_event_id)
  );

create policy audit_events_participant_read
  on public.audit_events for select
  to authenticated
  using (public.can_access_resource_event(resource_event_id));

revoke all on public.resource_events from anon, authenticated;
revoke all on public.delivery_confirmations from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;

grant select, insert, update, delete on public.resource_events to authenticated;
grant select, insert on public.delivery_confirmations to authenticated;
grant select on public.audit_events to authenticated;

grant all on public.resource_events to service_role;
grant all on public.delivery_confirmations to service_role;
grant all on public.audit_events to service_role;

commit;
