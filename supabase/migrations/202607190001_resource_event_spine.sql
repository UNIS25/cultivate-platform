begin;

create type public.resource_event_status as enum (
  'draft',
  'available',
  'matched',
  'accepted',
  'collected',
  'delivered',
  'cancelled',
  'expired'
);

create table public.resource_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete restrict,
  source_type text not null check (source_type in ('surplus_listing', 'manual', 'adapter')),
  source_id uuid not null,
  material_category text not null check (char_length(material_category) between 1 and 120),
  quantity_kg numeric(10, 2) not null check (quantity_kg > 0),
  status public.resource_event_status not null default 'draft',
  source_location uuid not null references public.organisation_locations(id) on delete restrict,
  destination_id uuid references public.organisations(id) on delete restrict,
  current_match_id uuid,
  collection_id uuid,
  delivery_confirmation_id uuid,
  impact_record_id uuid,
  matched_at timestamptz,
  accepted_at timestamptz,
  collected_at timestamptz,
  delivered_at timestamptz,
  impact_recorded_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, source_id),
  check (delivered_at is null or collected_at is null or delivered_at >= collected_at),
  check (impact_recorded_at is null or delivered_at is not null)
);

alter table public.matches
  add column resource_event_id uuid references public.resource_events(id) on delete restrict;

alter table public.collections
  add column resource_event_id uuid unique references public.resource_events(id) on delete restrict;

create table public.delivery_confirmations (
  id uuid primary key default gen_random_uuid(),
  resource_event_id uuid not null unique references public.resource_events(id) on delete restrict,
  collection_id uuid not null unique references public.collections(id) on delete restrict,
  confirmed_by_organisation_id uuid not null references public.organisations(id) on delete restrict,
  delivered_quantity_kg numeric(10, 2) not null check (delivered_quantity_kg > 0),
  delivered_at timestamptz not null,
  condition_note text not null default '',
  is_public boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.impact_records
  add column resource_event_id uuid unique references public.resource_events(id) on delete restrict,
  add column delivery_confirmation_id uuid unique references public.delivery_confirmations(id) on delete restrict;

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'offer_created',
    'match_proposed',
    'recipient_accepted',
    'collection_confirmed',
    'delivery_confirmed',
    'impact_recorded',
    'status_changed'
  )),
  resource_event_id uuid not null references public.resource_events(id) on delete restrict,
  acting_organisation_id uuid references public.organisations(id) on delete set null,
  acting_user_id uuid references auth.users(id) on delete set null,
  actor_label text not null default 'CULTIVATE Next demonstration service',
  occurred_at timestamptz not null default now(),
  previous_status public.resource_event_status,
  new_status public.resource_event_status,
  note text,
  created_at timestamptz not null default now()
);

alter table public.resource_events
  add constraint resource_events_current_match_fk
    foreign key (current_match_id) references public.matches(id) on delete set null,
  add constraint resource_events_collection_fk
    foreign key (collection_id) references public.collections(id) on delete set null,
  add constraint resource_events_delivery_confirmation_fk
    foreign key (delivery_confirmation_id) references public.delivery_confirmations(id) on delete set null,
  add constraint resource_events_impact_record_fk
    foreign key (impact_record_id) references public.impact_records(id) on delete set null;

create trigger resource_events_set_updated_at
  before update on public.resource_events
  for each row execute function public.set_updated_at();

create function public.resource_event_id_for_listing(target_listing_id uuid)
returns uuid
language sql
immutable
set search_path = public
as $$
  select md5('cultivate-next:resource-event:' || target_listing_id::text)::uuid;
$$;

create function public.resource_status_from_listing(target_status public.listing_status)
returns public.resource_event_status
language sql
immutable
set search_path = public
as $$
  select case target_status
    when 'draft' then 'draft'::public.resource_event_status
    when 'available' then 'available'::public.resource_event_status
    when 'reserved' then 'matched'::public.resource_event_status
    when 'collected' then 'collected'::public.resource_event_status
    when 'cancelled' then 'cancelled'::public.resource_event_status
    when 'expired' then 'expired'::public.resource_event_status
  end;
$$;

create function public.sync_listing_resource_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_name text;
  target_event_id uuid;
  mapped_status public.resource_event_status;
begin
  select name into category_name
    from public.food_categories
   where id = new.food_category_id;

  target_event_id := public.resource_event_id_for_listing(new.id);
  mapped_status := public.resource_status_from_listing(new.status);

  insert into public.resource_events (
    id,
    organisation_id,
    source_type,
    source_id,
    material_category,
    quantity_kg,
    status,
    source_location,
    destination_id,
    matched_at,
    collected_at,
    created_by,
    created_at,
    updated_at
  ) values (
    target_event_id,
    new.donor_organisation_id,
    'surplus_listing',
    new.id,
    category_name,
    new.quantity_kg,
    mapped_status,
    new.location_id,
    new.recipient_organisation_id,
    case when mapped_status in ('matched', 'accepted', 'collected', 'delivered') then coalesce(new.updated_at, now()) end,
    new.collected_at,
    new.created_by,
    new.created_at,
    new.updated_at
  )
  on conflict (source_type, source_id) do update
    set organisation_id = excluded.organisation_id,
        material_category = excluded.material_category,
        quantity_kg = excluded.quantity_kg,
        status = case
          when resource_events.status = 'delivered' then resource_events.status
          when resource_events.status = 'accepted' and excluded.status = 'matched' then resource_events.status
          else excluded.status
        end,
        source_location = excluded.source_location,
        destination_id = coalesce(excluded.destination_id, resource_events.destination_id),
        matched_at = coalesce(resource_events.matched_at, excluded.matched_at),
        collected_at = coalesce(excluded.collected_at, resource_events.collected_at),
        updated_at = greatest(resource_events.updated_at, excluded.updated_at);

  return new;
end;
$$;

create trigger surplus_listings_sync_resource_event
  after insert or update on public.surplus_listings
  for each row execute function public.sync_listing_resource_event();

insert into public.resource_events (
  id,
  organisation_id,
  source_type,
  source_id,
  material_category,
  quantity_kg,
  status,
  source_location,
  destination_id,
  matched_at,
  collected_at,
  created_by,
  created_at,
  updated_at
)
select
  public.resource_event_id_for_listing(listing.id),
  listing.donor_organisation_id,
  'surplus_listing',
  listing.id,
  category.name,
  listing.quantity_kg,
  public.resource_status_from_listing(listing.status),
  listing.location_id,
  listing.recipient_organisation_id,
  case when listing.status in ('reserved', 'collected') then listing.updated_at end,
  listing.collected_at,
  listing.created_by,
  listing.created_at,
  listing.updated_at
from public.surplus_listings listing
join public.food_categories category on category.id = listing.food_category_id
on conflict (source_type, source_id) do nothing;

update public.matches match_record
   set resource_event_id = public.resource_event_id_for_listing(match_record.listing_id)
 where match_record.resource_event_id is null;

update public.collections collection_record
   set resource_event_id = public.resource_event_id_for_listing(collection_record.listing_id)
 where collection_record.resource_event_id is null;

update public.resource_events resource_event
   set current_match_id = match_record.id,
       destination_id = match_record.recipient_organisation_id,
       matched_at = coalesce(resource_event.matched_at, match_record.recommended_at),
       accepted_at = case when match_record.status = 'accepted' then coalesce(match_record.responded_at, match_record.updated_at) else resource_event.accepted_at end,
       status = case when match_record.status = 'accepted' then 'accepted'::public.resource_event_status else resource_event.status end
  from public.matches match_record
 where match_record.resource_event_id = resource_event.id
   and match_record.status in ('recommended', 'accepted');

update public.resource_events resource_event
   set collection_id = collection_record.id,
       destination_id = collection_record.recipient_organisation_id,
       collected_at = coalesce(collection_record.completed_at, resource_event.collected_at),
       status = case when collection_record.status = 'completed' then 'collected'::public.resource_event_status else resource_event.status end
  from public.collections collection_record
 where collection_record.resource_event_id = resource_event.id;

insert into public.delivery_confirmations (
  id,
  resource_event_id,
  collection_id,
  confirmed_by_organisation_id,
  delivered_quantity_kg,
  delivered_at,
  condition_note,
  is_public,
  created_at
)
select
  md5('cultivate-next:delivery:' || collection_record.id::text)::uuid,
  collection_record.resource_event_id,
  collection_record.id,
  collection_record.recipient_organisation_id,
  collection_record.quantity_kg,
  coalesce(collection_record.completed_at, collection_record.updated_at) + interval '1 hour',
  'Migrated completed collection; delivery confirmation preserved as fictional demonstration evidence.',
  collection_record.is_public,
  coalesce(collection_record.completed_at, collection_record.updated_at) + interval '1 hour'
from public.collections collection_record
where collection_record.status = 'completed'
on conflict (resource_event_id) do nothing;

update public.resource_events resource_event
   set delivery_confirmation_id = delivery.id,
       delivered_at = delivery.delivered_at,
       status = 'delivered',
       updated_at = greatest(resource_event.updated_at, delivery.delivered_at)
  from public.delivery_confirmations delivery
 where delivery.resource_event_id = resource_event.id;

update public.impact_records impact
   set resource_event_id = collection_record.resource_event_id,
       delivery_confirmation_id = delivery.id
  from public.collections collection_record
  join public.delivery_confirmations delivery on delivery.collection_id = collection_record.id
 where impact.collection_id = collection_record.id
   and impact.resource_event_id is null;

update public.resource_events resource_event
   set impact_record_id = impact.id,
       impact_recorded_at = impact.recorded_at,
       updated_at = greatest(resource_event.updated_at, impact.recorded_at)
  from public.impact_records impact
 where impact.resource_event_id = resource_event.id;

create function public.audit_type_for_status(target_status public.resource_event_status)
returns text
language sql
immutable
set search_path = public
as $$
  select case target_status
    when 'matched' then 'match_proposed'
    when 'accepted' then 'recipient_accepted'
    when 'collected' then 'collection_confirmed'
    when 'delivered' then 'delivery_confirmed'
    else 'status_changed'
  end;
$$;

create function public.record_resource_event_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_org uuid;
  event_time timestamptz;
begin
  select organisation_id into acting_org from public.users where id = auth.uid();

  if tg_op = 'INSERT' then
    insert into public.audit_events (
      event_type, resource_event_id, acting_organisation_id, acting_user_id,
      actor_label, occurred_at, new_status, note
    ) values (
      'offer_created', new.id, coalesce(acting_org, new.organisation_id), auth.uid(),
      case when auth.uid() is null then 'Fictional demonstration seed' else 'Authenticated organisation member' end,
      new.created_at, 'available', 'Surplus offer entered the shared resource workflow.'
    );

    if new.status in ('matched', 'accepted', 'collected', 'delivered') then
      insert into public.audit_events (
        event_type, resource_event_id, acting_organisation_id, actor_label,
        occurred_at, previous_status, new_status, note
      ) values (
        'match_proposed', new.id, new.organisation_id, 'Fictional matching service',
        coalesce(new.matched_at, new.created_at), 'available', 'matched', 'A compatible recipient was proposed.'
      );
    end if;

    if new.status in ('accepted', 'collected', 'delivered') then
      insert into public.audit_events (
        event_type, resource_event_id, acting_organisation_id, actor_label,
        occurred_at, previous_status, new_status, note
      ) values (
        'recipient_accepted', new.id, new.destination_id, 'Fictional recipient coordinator',
        coalesce(new.accepted_at, new.matched_at, new.created_at), 'matched', 'accepted', 'Recipient acceptance recorded.'
      );
    end if;

    if new.status in ('collected', 'delivered') then
      insert into public.audit_events (
        event_type, resource_event_id, acting_organisation_id, actor_label,
        occurred_at, previous_status, new_status, note
      ) values (
        'collection_confirmed', new.id, new.organisation_id, 'Fictional collection coordinator',
        coalesce(new.collected_at, new.updated_at), 'accepted', 'collected', 'Collection handover confirmed.'
      );
    end if;

    if new.status = 'delivered' then
      insert into public.audit_events (
        event_type, resource_event_id, acting_organisation_id, actor_label,
        occurred_at, previous_status, new_status, note
      ) values (
        'delivery_confirmed', new.id, new.destination_id, 'Fictional recipient coordinator',
        coalesce(new.delivered_at, new.updated_at), 'collected', 'delivered', 'Delivery and receipt confirmed.'
      );
    end if;
  elsif new.status is distinct from old.status then
    event_time := case new.status
      when 'matched' then coalesce(new.matched_at, now())
      when 'accepted' then coalesce(new.accepted_at, now())
      when 'collected' then coalesce(new.collected_at, now())
      when 'delivered' then coalesce(new.delivered_at, now())
      else now()
    end;

    insert into public.audit_events (
      event_type, resource_event_id, acting_organisation_id, acting_user_id,
      actor_label, occurred_at, previous_status, new_status, note
    ) values (
      public.audit_type_for_status(new.status), new.id, coalesce(acting_org, new.destination_id, new.organisation_id), auth.uid(),
      case when auth.uid() is null then 'CULTIVATE Next workflow service' else 'Authenticated organisation member' end,
      event_time, old.status, new.status,
      coalesce(nullif(current_setting('cultivate.audit_note', true), ''), 'Resource-event workflow status changed.')
    );
  end if;

  return new;
end;
$$;

create trigger resource_events_record_audit
  after insert or update on public.resource_events
  for each row execute function public.record_resource_event_audit();

insert into public.audit_events (
  event_type,
  resource_event_id,
  acting_organisation_id,
  actor_label,
  occurred_at,
  new_status,
  note
)
select
  'offer_created',
  resource_event.id,
  resource_event.organisation_id,
  'Migrated fictional demonstration record',
  resource_event.created_at,
  'available',
  'Offer creation preserved while establishing the resource-event spine.'
from public.resource_events resource_event
where not exists (
  select 1 from public.audit_events audit
   where audit.resource_event_id = resource_event.id
     and audit.event_type = 'offer_created'
);

insert into public.audit_events (
  event_type, resource_event_id, acting_organisation_id, actor_label,
  occurred_at, previous_status, new_status, note
)
select
  'collection_confirmed', resource_event.id, resource_event.organisation_id,
  'Migrated fictional collection record', resource_event.collected_at,
  'accepted', 'collected', 'Completed collection preserved during additive migration.'
from public.resource_events resource_event
where resource_event.collected_at is not null
  and not exists (
    select 1 from public.audit_events audit
     where audit.resource_event_id = resource_event.id
       and audit.event_type = 'collection_confirmed'
  );

insert into public.audit_events (
  event_type, resource_event_id, acting_organisation_id, actor_label,
  occurred_at, previous_status, new_status, note
)
select
  'delivery_confirmed', resource_event.id, resource_event.destination_id,
  'Migrated fictional delivery record', resource_event.delivered_at,
  'collected', 'delivered', 'Delivery evidence derived from an existing completed collection.'
from public.resource_events resource_event
where resource_event.delivered_at is not null
  and not exists (
    select 1 from public.audit_events audit
     where audit.resource_event_id = resource_event.id
       and audit.event_type = 'delivery_confirmed'
  );

insert into public.audit_events (
  event_type, resource_event_id, acting_organisation_id, actor_label,
  occurred_at, previous_status, new_status, note
)
select
  'impact_recorded', resource_event.id, resource_event.destination_id,
  'CULTIVATE Next impact calculator', resource_event.impact_recorded_at,
  'delivered', 'delivered', 'Impact estimate calculated from a delivered resource event.'
from public.resource_events resource_event
where resource_event.impact_recorded_at is not null
  and not exists (
    select 1 from public.audit_events audit
     where audit.resource_event_id = resource_event.id
       and audit.event_type = 'impact_recorded'
  );

create function public.attach_match_resource_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.resource_event_id is null then
    new.resource_event_id := public.resource_event_id_for_listing(new.listing_id);
  end if;
  return new;
end;
$$;

create trigger matches_attach_resource_event
  before insert or update on public.matches
  for each row execute function public.attach_match_resource_event();

create function public.sync_match_resource_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.resource_events
     set current_match_id = new.id,
         destination_id = new.recipient_organisation_id,
         matched_at = coalesce(matched_at, new.recommended_at),
         accepted_at = case when new.status = 'accepted' then coalesce(new.responded_at, now()) else accepted_at end,
         status = case
           when new.status = 'accepted' then 'accepted'::public.resource_event_status
           when new.status = 'recommended' and status = 'available' then 'matched'::public.resource_event_status
           when new.status in ('cancelled', 'rejected', 'expired') and status in ('matched', 'accepted') then 'available'::public.resource_event_status
           else status
         end
   where id = new.resource_event_id;
  return new;
end;
$$;

create trigger matches_sync_resource_event
  after insert or update on public.matches
  for each row execute function public.sync_match_resource_event();

create function public.attach_collection_resource_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.resource_event_id is null then
    new.resource_event_id := public.resource_event_id_for_listing(new.listing_id);
  end if;
  return new;
end;
$$;

create trigger collections_attach_resource_event
  before insert or update on public.collections
  for each row execute function public.attach_collection_resource_event();

create function public.sync_collection_resource_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.resource_events
     set collection_id = new.id,
         destination_id = new.recipient_organisation_id,
         collected_at = case when new.status = 'completed' then coalesce(new.completed_at, now()) else collected_at end,
         status = case when new.status = 'completed' then 'collected'::public.resource_event_status else status end
   where id = new.resource_event_id;
  return new;
end;
$$;

create trigger collections_sync_resource_event
  after insert or update on public.collections
  for each row execute function public.sync_collection_resource_event();

create function public.sync_delivery_resource_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.collections
     where id = new.collection_id
       and resource_event_id = new.resource_event_id
       and status = 'completed'
  ) then
    raise exception 'Delivery confirmation requires a completed collection for the same resource event';
  end if;

  update public.resource_events
     set delivery_confirmation_id = new.id,
         delivered_at = new.delivered_at,
         status = 'delivered'
   where id = new.resource_event_id;
  return new;
end;
$$;

create trigger delivery_confirmations_sync_resource_event
  after insert on public.delivery_confirmations
  for each row execute function public.sync_delivery_resource_event();

create function public.validate_delivered_impact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  linked_event_id uuid;
  linked_delivery_id uuid;
begin
  select collection_record.resource_event_id, delivery.id
    into linked_event_id, linked_delivery_id
    from public.collections collection_record
    join public.delivery_confirmations delivery on delivery.collection_id = collection_record.id
   where collection_record.id = new.collection_id;

  if linked_event_id is null or not exists (
    select 1 from public.resource_events
     where id = linked_event_id
       and status = 'delivered'
       and delivered_at is not null
  ) then
    raise exception 'Impact can only be generated from a delivered resource event';
  end if;

  new.resource_event_id := linked_event_id;
  new.delivery_confirmation_id := linked_delivery_id;
  return new;
end;
$$;

create trigger impact_records_require_delivery
  before insert or update on public.impact_records
  for each row execute function public.validate_delivered_impact();

create function public.sync_impact_resource_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.resource_events
     set impact_record_id = new.id,
         impact_recorded_at = new.recorded_at
   where id = new.resource_event_id;

  insert into public.audit_events (
    event_type, resource_event_id, acting_organisation_id, acting_user_id,
    actor_label, occurred_at, previous_status, new_status, note
  ) values (
    'impact_recorded', new.resource_event_id, new.organisation_id, auth.uid(),
    'CULTIVATE Next impact calculator', new.recorded_at, 'delivered', 'delivered',
    'Demonstration impact estimate generated from confirmed delivery.'
  );
  return new;
end;
$$;

create trigger impact_records_sync_resource_event
  after insert on public.impact_records
  for each row execute function public.sync_impact_resource_event();

create function public.protect_audit_event()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Audit events are append-only and cannot be edited or deleted';
end;
$$;

create trigger audit_events_append_only
  before update or delete on public.audit_events
  for each row execute function public.protect_audit_event();

create function public.protect_resource_event_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_platform_admin() then
    if new.id is distinct from old.id
      or new.organisation_id is distinct from old.organisation_id
      or new.source_type is distinct from old.source_type
      or new.source_id is distinct from old.source_id
      or new.source_location is distinct from old.source_location
      or new.created_by is distinct from old.created_by
      or new.created_at is distinct from old.created_at then
      raise exception 'Resource-event identity and provenance fields are immutable';
    end if;

    if new.status is distinct from old.status and not (
      (old.status = 'draft' and new.status in ('available', 'cancelled'))
      or (old.status = 'available' and new.status in ('matched', 'cancelled', 'expired'))
      or (old.status = 'matched' and new.status in ('accepted', 'available', 'cancelled', 'expired'))
      or (old.status = 'accepted' and new.status in ('collected', 'cancelled'))
      or (old.status = 'collected' and new.status = 'delivered')
    ) then
      raise exception 'Invalid resource-event status transition';
    end if;

    if old.status = 'delivered' and new is distinct from old then
      raise exception 'Delivered resource events are immutable';
    end if;
  end if;
  return new;
end;
$$;

create trigger resource_events_protect_fields
  before update on public.resource_events
  for each row execute function public.protect_resource_event_fields();

create index resource_events_organisation_status_idx on public.resource_events (organisation_id, status);
create index resource_events_destination_status_idx on public.resource_events (destination_id, status);
create index resource_events_created_at_idx on public.resource_events (created_at desc);
create index resource_events_delivered_at_idx on public.resource_events (delivered_at desc) where status = 'delivered';
create index resource_events_category_idx on public.resource_events (material_category);
create index matches_resource_event_idx on public.matches (resource_event_id, status);
create index delivery_confirmations_delivered_at_idx on public.delivery_confirmations (delivered_at desc);
create index audit_events_resource_occurred_idx on public.audit_events (resource_event_id, occurred_at, id);
create index audit_events_type_occurred_idx on public.audit_events (event_type, occurred_at desc);

comment on table public.resource_events is 'Shared operational spine linking donor, listing, recipient, match, collection, delivery and impact through stable IDs.';
comment on column public.resource_events.source_id is 'Stable identifier in the source table or future adapter; source_type identifies its namespace.';
comment on table public.audit_events is 'Append-only chain-of-custody and status history. Client roles receive no update or delete grants.';
comment on table public.delivery_confirmations is 'Evidence boundary required before any impact record may be generated.';

revoke all on function public.resource_event_id_for_listing(uuid) from public;
revoke all on function public.resource_status_from_listing(public.listing_status) from public;
revoke all on function public.sync_listing_resource_event() from public;
revoke all on function public.record_resource_event_audit() from public;
revoke all on function public.attach_match_resource_event() from public;
revoke all on function public.sync_match_resource_event() from public;
revoke all on function public.attach_collection_resource_event() from public;
revoke all on function public.sync_collection_resource_event() from public;
revoke all on function public.sync_delivery_resource_event() from public;
revoke all on function public.validate_delivered_impact() from public;
revoke all on function public.sync_impact_resource_event() from public;
revoke all on function public.protect_audit_event() from public;
revoke all on function public.protect_resource_event_fields() from public;

commit;
