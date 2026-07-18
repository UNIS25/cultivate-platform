begin;

create extension if not exists pgcrypto with schema extensions;

create type public.organisation_kind as enum ('initiative', 'donor', 'recipient', 'hybrid');
create type public.organisation_status as enum ('active', 'pilot', 'seasonal', 'inactive');
create type public.location_visibility as enum ('public', 'generalised', 'private');
create type public.listing_status as enum ('draft', 'available', 'reserved', 'collected', 'cancelled', 'expired');
create type public.food_handling as enum ('ambient', 'chilled', 'frozen');
create type public.match_status as enum ('recommended', 'accepted', 'rejected', 'expired', 'cancelled');
create type public.collection_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled', 'failed');
create type public.resource_status as enum ('draft', 'published', 'archived');
create type public.user_role as enum ('viewer', 'coordinator', 'organisation_admin', 'platform_admin');

create table public.food_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind public.organisation_kind not null,
  name text not null,
  organisation_type text not null,
  status public.organisation_status not null default 'active',
  description text not null default '',
  verified boolean not null default false,
  public_profile boolean not null default true,
  weekly_capacity_kg numeric(10, 2) check (weekly_capacity_kg is null or weekly_capacity_kg >= 0),
  recipient_capacity_kg numeric(10, 2) check (recipient_capacity_kg is null or recipient_capacity_kg >= 0),
  active_volunteers integer check (active_volunteers is null or active_volunteers >= 0),
  households_supported integer check (households_supported is null or households_supported >= 0),
  governance_score integer check (governance_score is null or governance_score between 0 and 100),
  reliability_score integer check (reliability_score is null or reliability_score between 0 and 100),
  donations_this_month integer check (donations_this_month is null or donations_this_month >= 0),
  has_refrigeration boolean not null default false,
  time_zone text,
  opening_days text[] not null default '{}',
  opens_at time,
  closes_at time,
  next_collection_label text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (opening_days <@ array['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']::text[]),
  check (
    (opens_at is null and closes_at is null)
    or (opens_at is not null and closes_at is not null and opens_at < closes_at)
  )
);

create table public.organisation_locations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  label text not null default 'Primary location',
  city text not null,
  country text not null,
  address_line_1 text,
  postal_code text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  visibility public.location_visibility not null default 'generalised',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (visibility = 'private' or (address_line_1 is null and postal_code is null))
);

create unique index organisation_locations_one_primary
  on public.organisation_locations (organisation_id)
  where is_primary;

create table public.organisation_food_categories (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  food_category_id uuid not null references public.food_categories(id) on delete cascade,
  priority integer not null default 0 check (priority between 0 and 100),
  created_at timestamptz not null default now(),
  primary key (organisation_id, food_category_id)
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null,
  role public.user_role not null default 'viewer',
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.surplus_listings (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  donor_organisation_id uuid not null references public.organisations(id) on delete restrict,
  recipient_organisation_id uuid references public.organisations(id) on delete restrict,
  location_id uuid not null references public.organisation_locations(id) on delete restrict,
  food_category_id uuid not null references public.food_categories(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 160),
  quantity_kg numeric(10, 2) not null check (quantity_kg > 0),
  estimated_meals integer not null default 0 check (estimated_meals >= 0),
  available_from timestamptz not null,
  collection_deadline timestamptz not null,
  collected_at timestamptz,
  status public.listing_status not null default 'draft',
  handling public.food_handling not null default 'ambient',
  notes text not null default '',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (collection_deadline > available_from),
  check (status <> 'collected' or (collected_at is not null and recipient_organisation_id is not null))
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.surplus_listings(id) on delete cascade,
  recipient_organisation_id uuid not null references public.organisations(id) on delete restrict,
  status public.match_status not null default 'recommended',
  score integer not null check (score between 0 and 100),
  eligible boolean not null default false,
  distance_km numeric(10, 2) not null check (distance_km >= 0),
  scoring_method text not null,
  score_breakdown jsonb not null default '[]'::jsonb check (jsonb_typeof(score_breakdown) = 'array'),
  blockers jsonb not null default '[]'::jsonb check (jsonb_typeof(blockers) = 'array'),
  recommended_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, recipient_organisation_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete set null,
  listing_id uuid not null unique references public.surplus_listings(id) on delete restrict,
  donor_organisation_id uuid not null references public.organisations(id) on delete restrict,
  recipient_organisation_id uuid not null references public.organisations(id) on delete restrict,
  location_id uuid not null references public.organisation_locations(id) on delete restrict,
  status public.collection_status not null default 'scheduled',
  quantity_kg numeric(10, 2) not null check (quantity_kg > 0),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  is_public boolean not null default false,
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'completed' or completed_at is not null)
);

create table public.impact_records (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null unique references public.collections(id) on delete restrict,
  organisation_id uuid references public.organisations(id) on delete set null,
  food_redistributed_kg numeric(10, 2) not null check (food_redistributed_kg >= 0),
  estimated_meals integer not null check (estimated_meals >= 0),
  financial_value_eur numeric(12, 2) not null check (financial_value_eur >= 0),
  estimated_waste_avoided_kg numeric(10, 2) not null check (estimated_waste_avoided_kg >= 0),
  estimated_co2e_avoided_kg numeric(10, 2) check (estimated_co2e_avoided_kg is null or estimated_co2e_avoided_kg >= 0),
  assumptions_version text not null,
  assumptions_snapshot jsonb not null check (jsonb_typeof(assumptions_snapshot) = 'object'),
  is_public boolean not null default false,
  recorded_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.governance_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  summary text not null,
  content text not null default '',
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  area text not null,
  effort_label text not null,
  audience text not null default 'Network coordinators',
  status public.resource_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create table public.engagement_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  summary text not null,
  content text not null default '',
  resource_type text not null,
  audience text not null,
  external_url text,
  status public.resource_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger food_categories_set_updated_at before update on public.food_categories
  for each row execute function public.set_updated_at();
create trigger organisations_set_updated_at before update on public.organisations
  for each row execute function public.set_updated_at();
create trigger organisation_locations_set_updated_at before update on public.organisation_locations
  for each row execute function public.set_updated_at();
create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger surplus_listings_set_updated_at before update on public.surplus_listings
  for each row execute function public.set_updated_at();
create trigger matches_set_updated_at before update on public.matches
  for each row execute function public.set_updated_at();
create trigger collections_set_updated_at before update on public.collections
  for each row execute function public.set_updated_at();
create trigger governance_resources_set_updated_at before update on public.governance_resources
  for each row execute function public.set_updated_at();
create trigger engagement_resources_set_updated_at before update on public.engagement_resources
  for each row execute function public.set_updated_at();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

insert into public.users (id, full_name, avatar_url)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', ''),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

create function public.validate_collection_parties()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  listing_record record;
  match_record record;
begin
  select donor_organisation_id, location_id, quantity_kg
    into listing_record
    from public.surplus_listings
   where id = new.listing_id;

  if not found then
    raise exception 'Collection listing does not exist';
  end if;

  if new.donor_organisation_id <> listing_record.donor_organisation_id then
    raise exception 'Collection donor must match the listing donor';
  end if;

  if new.location_id <> listing_record.location_id then
    raise exception 'Collection location must match the listing location';
  end if;

  if new.quantity_kg > listing_record.quantity_kg then
    raise exception 'Collected quantity cannot exceed the listed quantity';
  end if;

  if new.match_id is not null then
    select listing_id, recipient_organisation_id
      into match_record
      from public.matches
     where id = new.match_id;

    if not found
      or match_record.listing_id <> new.listing_id
      or match_record.recipient_organisation_id <> new.recipient_organisation_id then
      raise exception 'Collection parties must match the selected match';
    end if;
  end if;

  if new.status = 'completed' and new.completed_at is null then
    new.completed_at = now();
  end if;

  return new;
end;
$$;

create trigger collections_validate_parties
  before insert or update on public.collections
  for each row execute function public.validate_collection_parties();

create function public.sync_completed_collection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    update public.surplus_listings
       set status = 'collected',
           recipient_organisation_id = new.recipient_organisation_id,
           collected_at = new.completed_at
     where id = new.listing_id;
  end if;
  return new;
end;
$$;

create trigger collections_sync_completed_listing
  after insert or update on public.collections
  for each row execute function public.sync_completed_collection();

create index organisations_kind_status_idx on public.organisations (kind, status);
create index organisation_locations_org_idx on public.organisation_locations (organisation_id);
create index organisation_locations_coordinates_idx on public.organisation_locations (latitude, longitude);
create index organisation_food_categories_category_idx on public.organisation_food_categories (food_category_id);
create index users_organisation_idx on public.users (organisation_id);
create index surplus_listings_status_deadline_idx on public.surplus_listings (status, collection_deadline);
create index surplus_listings_donor_idx on public.surplus_listings (donor_organisation_id);
create index surplus_listings_recipient_idx on public.surplus_listings (recipient_organisation_id);
create index surplus_listings_category_idx on public.surplus_listings (food_category_id);
create index matches_listing_status_idx on public.matches (listing_id, status);
create index matches_recipient_status_idx on public.matches (recipient_organisation_id, status);
create index collections_donor_status_idx on public.collections (donor_organisation_id, status);
create index collections_recipient_status_idx on public.collections (recipient_organisation_id, status);
create index collections_completed_at_idx on public.collections (completed_at desc) where status = 'completed';
create index impact_records_organisation_recorded_idx on public.impact_records (organisation_id, recorded_at desc);
create index governance_resources_status_published_idx on public.governance_resources (status, published_at desc);
create index engagement_resources_status_published_idx on public.engagement_resources (status, published_at desc);

comment on table public.users is 'Application profiles linked one-to-one to Supabase Auth users.';
comment on column public.organisation_locations.visibility is 'Public and generalised rows are discoverable; private rows are restricted to members.';
comment on column public.matches.score_breakdown is 'Transparent factor-by-factor score snapshot; never an opaque model output.';
comment on column public.impact_records.assumptions_snapshot is 'Immutable copy of the demonstration assumptions used when this record was calculated.';

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.sync_completed_collection() from public;

commit;
