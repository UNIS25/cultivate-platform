# Row-level security

All application tables have PostgreSQL row-level security enabled. The original policies live in `supabase/migrations/202607180002_row_level_security.sql`; the resource-event, delivery, audit, and aggregate-transparency policies are added by `supabase/migrations/202607190002_resource_event_rls.sql`. Policies use Supabase Auth's `auth.uid()` and the application profile in `public.users`.

The browser uses only a publishable key. Never expose the `service_role` key to Next.js Client Components or any `NEXT_PUBLIC_*` variable; `service_role` bypasses RLS and is reserved for trusted maintenance, user assignment, and controlled impact-record creation.

## Roles and membership

Each `auth.users` record receives a matching `public.users` profile through `handle_new_auth_user()`. Existing Auth users are backfilled when the initial migration runs.

An application user has one optional `organisation_id` and one role:

| Role | Purpose |
| --- | --- |
| `viewer` | Read participant data for their organisation |
| `coordinator` | Create listings and operate matches and collections for their organisation |
| `organisation_admin` | Coordinator access plus organisation and location maintenance |
| `platform_admin` | Cross-network administration and resource publishing |

Organisation assignment and role elevation are service-side administrative operations. A user cannot change their own organisation or role through the public API; authenticated users receive column-level update permission only for `full_name` and `avatar_url`.

Security-definer helpers read the current profile without triggering recursive RLS evaluation:

- `current_user_organisation_id()`
- `current_user_role()`
- `is_platform_admin()`
- `is_organisation_member(uuid)`
- `can_manage_organisation(uuid)`
- `listing_donor_organisation(uuid)`
- `location_belongs_to_organisation(uuid, uuid)`
- `can_access_collection(uuid)`
- `can_access_resource_event(uuid)`
- `can_manage_resource_event(uuid)`

Execution is granted only where a policy requires it. These functions do not accept a user ID, so callers cannot impersonate another profile.

## Policy catalogue

| Table | Policy | Command | Access rule |
| --- | --- | --- | --- |
| `food_categories` | `food_categories_public_read` | `SELECT` | Anonymous and authenticated users can read active categories; platform admins can also read inactive categories. |
| `food_categories` | `food_categories_platform_manage` | `ALL` | Platform admins can create, edit, and delete categories. |
| `organisations` | `organisations_public_read` | `SELECT` | Public profiles are readable unless inactive. |
| `organisations` | `organisations_member_read_private` | `SELECT` | Members can read their own organisation even when it is not public. |
| `organisations` | `organisations_platform_insert` | `INSERT` | Only platform admins can create organisations through the authenticated API. |
| `organisations` | `organisations_admin_update` | `UPDATE` | Organisation coordinators/admins can update their organisation; platform admins can update any organisation. |
| `organisations` | `organisations_platform_delete` | `DELETE` | Only platform admins can delete organisations. |
| `organisation_locations` | `organisation_locations_public_read` | `SELECT` | Public/generalised locations are readable when their organisation has an active public profile. |
| `organisation_locations` | `organisation_locations_member_read_private` | `SELECT` | Members can read all locations belonging to their organisation. |
| `organisation_locations` | `organisation_locations_admin_insert` | `INSERT` | Organisation coordinators/admins can add locations for their organisation. |
| `organisation_locations` | `organisation_locations_admin_update` | `UPDATE` | Organisation coordinators/admins can update their organisation's locations. |
| `organisation_locations` | `organisation_locations_admin_delete` | `DELETE` | Organisation coordinators/admins can remove their organisation's locations. |
| `organisation_food_categories` | `organisation_food_categories_public_read` | `SELECT` | Category capabilities for active public organisations are public. |
| `organisation_food_categories` | `organisation_food_categories_admin_insert` | `INSERT` | Organisation coordinators/admins can add their category capabilities. |
| `organisation_food_categories` | `organisation_food_categories_admin_update` | `UPDATE` | Organisation coordinators/admins can reprioritise their category capabilities. |
| `organisation_food_categories` | `organisation_food_categories_admin_delete` | `DELETE` | Organisation coordinators/admins can remove their category capabilities. |
| `users` | `users_self_or_colleague_read` | `SELECT` | Users can read themselves and colleagues in the same organisation; platform admins can read all profiles. |
| `users` | `users_self_update` | `UPDATE` | Users can update their own row, limited by grants to display name and avatar columns. |
| `surplus_listings` | `surplus_listings_public_read` | `SELECT` | Available, reserved, and collected listings from active public donors are discoverable. |
| `surplus_listings` | `surplus_listings_participant_read` | `SELECT` | Donor members and an assigned recipient can read non-public workflow states. |
| `surplus_listings` | `surplus_listings_donor_insert` | `INSERT` | Donor coordinators/admins can create listings only for their organisation, from one of its locations, and as themselves. |
| `surplus_listings` | `surplus_listings_donor_update` | `UPDATE` | Donor coordinators/admins can update their listings while retaining location ownership. |
| `surplus_listings` | `surplus_listings_donor_delete` | `DELETE` | Donor coordinators/admins can delete only draft or cancelled listings. |
| `matches` | `matches_participant_read` | `SELECT` | Only the listing's donor, proposed recipient, or a platform admin can read a persisted match. |
| `matches` | `matches_donor_insert` | `INSERT` | Donor coordinators/admins can store a recomputed recommendation for their listing as themselves. |
| `matches` | `matches_participant_update` | `UPDATE` | Donor or recipient coordinators/admins can respond to a match. |
| `matches` | `matches_platform_delete` | `DELETE` | Only platform admins can delete match evidence. |
| `collections` | `collections_public_completed_read` | `SELECT` | A completed collection is public only when explicitly marked `is_public`. |
| `collections` | `collections_participant_read` | `SELECT` | Donor and recipient members can read their collections. |
| `collections` | `collections_participant_insert` | `INSERT` | A coordinator/admin for either participant can schedule a collection as themselves. |
| `collections` | `collections_participant_update` | `UPDATE` | A coordinator/admin for either participant can progress the collection. |
| `collections` | `collections_platform_delete` | `DELETE` | Only platform admins can delete collections. |
| `impact_records` | `impact_records_public_read` | `SELECT` | Records explicitly marked public are readable by anyone. |
| `impact_records` | `impact_records_participant_read` | `SELECT` | Collection participants can read the associated non-public impact record. |
| `impact_records` | `impact_records_platform_insert` | `INSERT` | Only a platform admin can create an impact record through the authenticated API. Trusted backend jobs may use `service_role`. |
| `resource_events` | `resource_events_participant_read` | `SELECT` | Only donor members, the matched destination organisation, or a platform admin can read the operational spine. |
| `resource_events` | `resource_events_donor_insert` | `INSERT` | A donor coordinator/admin can create an event for its own organisation. |
| `resource_events` | `resource_events_participant_update` | `UPDATE` | Participant coordinators/admins can use guarded workflow transitions; identity and status rules still apply. |
| `delivery_confirmations` | `delivery_confirmations_participant_read` | `SELECT` | Only event participants or a platform admin can read delivery evidence. |
| `delivery_confirmations` | `delivery_confirmations_participant_insert` | `INSERT` | Participant coordinators/admins can confirm delivery for an event they manage. |
| `audit_events` | `audit_events_participant_read` | `SELECT` | Event participants or a platform admin can read custody evidence. Client roles have no update or delete grant. |
| `governance_resources` | `governance_resources_public_read` | `SELECT` | Published resources are public once `published_at` has passed. |
| `governance_resources` | `governance_resources_platform_manage` | `ALL` | Platform admins manage draft, published, and archived governance resources. |
| `engagement_resources` | `engagement_resources_public_read` | `SELECT` | Published resources are public once `published_at` has passed. |
| `engagement_resources` | `engagement_resources_platform_manage` | `ALL` | Platform admins manage draft, published, and archived engagement resources. |

## Additional database guards

RLS controls which rows a caller may address. Triggers and constraints protect invariants inside those rows:

- Public/generalised locations cannot contain `address_line_1` or `postal_code`; precise address records must be private.
- `protect_match_scoring_fields()` makes listing, recipient, score, factors, method, blockers, and creator immutable for non-platform users. It also enforces response-state transitions.
- `validate_collection_parties()` verifies the listing, donor, location, quantity, and optional match before a collection is written.
- `protect_collection_identity()` prevents participant substitution, invalid status transitions, and any mutation after completion.
- `sync_completed_collection()` marks the listing collected and records the recipient and completion time.
- Resource-event sync triggers connect legacy listing, match, collection, delivery, and impact writes through stable IDs.
- `validate_resource_event_transition()` enforces the permitted state graph and protects event identity.
- `transition_resource_event()` applies authorised state changes through a security-definer RPC while preserving RLS membership checks.
- `protect_audit_event_append_only()` rejects updates and deletions independently of client grants.
- Delivery confirmation is required before an event can become `delivered`; only delivered events can receive impact records.
- Impact records are append-only for application roles and retain an immutable assumptions snapshot.

## Public transparency boundary

Anonymous callers have no direct table grant for `resource_events`, `delivery_confirmations`, or `audit_events`. The public transparency page calls `get_transparency_statistics(date)`, a security-definer aggregate RPC with a fixed `search_path`.

The RPC returns only:

- same-day aggregate kilograms, meals, pickups, organisation count, and estimated CO2e;
- activity grouped by generalised city and country;
- recent delivery category, quantity, generalised area, and generated donor/recipient aliases.

It does not return organisation IDs, user IDs, contacts, precise addresses, postal codes, or exact private coordinates. Existing public organisation and listing discovery remains constrained to active public profiles and public/generalised locations. Researcher-facing exports are built from the same anonymised aggregate boundary.

## Resource-event status permissions

The allowed progression is:

```text
draft → available → matched → accepted → collected → delivered
```

`draft`, `available`, `matched`, and `accepted` may also transition to `cancelled`; `available`, `matched`, and `accepted` may transition to `expired`. Terminal states cannot be reopened through the client RPC. Collection and delivery transitions additionally require their corresponding evidence rows.

The demonstration role switcher is UI state only. It neither changes the authenticated profile nor alters these policies.

## Administrative assignment

After an Auth user signs up, assign their organisation and role from a trusted migration, Supabase dashboard, or service-side administration process:

```sql
update public.users
set organisation_id = '00000000-0000-0000-0000-000000000000',
    role = 'organisation_admin'
where id = '00000000-0000-0000-0000-000000000000';
```

Use real UUIDs from `public.organisations` and `auth.users`. Do not expose this operation as a client-side update.

## Policy inspection

After applying migrations, inspect the deployed policy set with:

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Run `npm run db:lint` against the local Supabase stack, and test policies with separate anonymous, viewer, coordinator, organisation-admin, and platform-admin sessions before production deployment.

For a remote deployment, back up the project, apply both resource-event migrations in timestamp order, review the migration diff, and repeat the RLS checks above. Do not seed a production project with `supabase/seed.sql`.
