# CULTIVATE Next

CULTIVATE Next is an independent exploratory prototype showing how food-surplus discovery, matching, collection, delivery, impact reporting, governance guidance, citizen engagement, and Community of Practice activity could work as one service.

Every organisation, person, offer, event, result, and recommendation in this repository is fictional demonstration data. The application does not use official CULTIVATE or Trinity logos, copy external-platform content, or make audited impact claims.

## What the application includes

| Route | Capability |
| --- | --- |
| `/` | Demonstration role dashboards for donors, recipients, municipalities, researchers, and platform administrators |
| `/map` | Interactive Leaflet map with generalised initiative, donor, recipient, and active-offer locations |
| `/initiatives/[slug]` | Supabase-backed initiative profiles |
| `/report` | Three-step surplus report with relative collection windows and authenticated persistence |
| `/matches` | Explainable recipient matching with a visible resource-event workflow |
| `/listings/[id]` | Resource-event status, six-stage timeline, custody trace, and transparent health indicators |
| `/impact` | Delivered-only impact estimates, filters, methodology, charts, and CSV export |
| `/transparency` | Public aggregate statistics and anonymised recent deliveries |
| `/recommendations` | Fictional governance, engagement, and practice-exchange resources |
| `/data-governance` | Access-level, privacy, security, and demonstration-limit explanations |

The top-level routes remain available in desktop and mobile navigation. Loading, empty, success, error, and not-found states are included where applicable.

## Technology

- Next.js App Router and React
- Strict TypeScript and Tailwind CSS
- Supabase Postgres, Auth, SSR clients, migrations, triggers, RPC functions, and RLS
- Leaflet with OpenStreetMap tiles
- Recharts for impact visualisation
- Playwright for desktop, mobile, workflow, schema, and privacy coverage

## Local setup

Requirements: Node.js 20.9+, npm 10+, Docker Desktop or a compatible runtime, and Google Chrome.

```bash
npm install
npm run db:start
npm run db:reset
cp .env.example .env.local
npm run dev
```

Use the local URL and public key reported by Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable or anon key>
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported for compatibility. Never place a service-role key in a `NEXT_PUBLIC_*` variable. A custom Leaflet-compatible tile URL can be supplied with `NEXT_PUBLIC_MAP_TILE_URL`; production deployments should use a provider appropriate to their traffic and terms.

## Commands

```bash
npm run dev        # Start Next.js locally
npm run lint       # Run ESLint
npm run typecheck  # Run strict TypeScript checking
npm test           # Run the Playwright suite at desktop and mobile sizes
npm run test:e2e   # Alias for the Playwright suite
npm run build      # Create and validate the production build
npm run start      # Serve the production build
npm run db:start   # Start the pinned local Supabase stack
npm run db:reset   # Reapply migrations and fictional seed data locally
npm run db:lint    # Lint the local database
npm run db:types   # Regenerate checked-in database types
npm run db:verify  # Verify dates, aggregate RPC output, RLS, and seed invariants
npm run db:stop    # Stop the local Supabase stack
```

Playwright starts the application when necessary. Tests that require Supabase public variables use the configured project; authenticated write coverage additionally requires `SUPABASE_E2E_AUTH=1` and a suitable test session. Those authenticated cases are reported as skipped when no session is deliberately supplied.

## Shared resource-event data spine

`resource_events` is the stable workflow record joining the existing domain without removing or rewriting the original tables:

```text
organisation / donor
        │
surplus_listing ── resource_event ── match ── recipient
                           │
                       collection
                           │
                 delivery_confirmation
                           │
                     impact_record
                           │
                      audit_events
```

Each event stores `id`, `organisation_id`, `source_type`, `source_id`, `material_category`, `quantity_kg`, `status`, `source_location`, `destination_id`, `matched_at`, `collected_at`, `delivered_at`, `created_at`, and `updated_at`. Valid statuses are `draft`, `available`, `matched`, `accepted`, `collected`, `delivered`, `cancelled`, and `expired`.

Stable event UUIDs are derived from existing listing IDs during the additive backfill. Foreign keys from `matches`, `collections`, `delivery_confirmations`, and `impact_records` establish the new relationships while preserving legacy rows and APIs. Database triggers keep compatible listing, match, collection, delivery, and event states aligned.

The operational path is:

```text
Report surplus → generate matches → recipient accepts → collection confirmed
→ delivery confirmed → impact calculated
```

Listing and match screens show the current stage and a six-point timeline: offer created, match proposed, recipient accepted, collected, delivered, and impact recorded. The unauthenticated prototype button simulates the next stage only in local UI state; authenticated API transitions use the guarded database function.

## Dates and rendering

Active fictional offers are generated from one UTC-day anchor, with deadlines in the next 72 hours. Completed collection and delivery records fall within the previous seven days. `src/lib/demo-dates.ts` performs this calculation once at the server data boundary; ISO values are then passed to Client Components so server and browser rendering remain deterministic. User-facing dates use an explicit Ireland-local format and timezone label.

The SQL seed uses the same relative-date rules. Verification fails if an active offer is expired or outside the 72-hour window, or if a completed record is older than seven days.

## Audit and chain of custody

`audit_events` records event type, resource-event ID, actor organisation or demo-user label, timestamp, previous status, new status, and an optional note. Status-changing database triggers append audit evidence automatically.

Application roles receive read-only access to relevant audit rows. `UPDATE` and `DELETE` privileges are revoked, and a database trigger rejects either operation even from a mistakenly broadened application grant. Completed listings expose a simplified custody panel to authorised participants; the public experience receives only anonymised aggregates.

## Roles and privacy

The dashboard role switcher is explicitly labelled as a demonstration presentation aid. It changes the displayed dashboard, not the signed-in user's permissions.

| Demonstration view | Main information |
| --- | --- |
| Food donor | Active offers, pending matches, delivered collections, impact estimates, and component health indicators |
| Recipient organisation | Nearby generalised food, accepted collections, capacity, and delivery history |
| Municipality | Area initiatives, coverage, surplus hotspots, diversion, and environmental estimates |
| Researcher | Anonymised aggregates, methodology, data-quality notice, and aggregate export |
| Platform administrator | Verification queue, flags, counts, activity, and data-quality alerts |

Actual authorisation remains in Supabase RLS:

- Public callers receive only public profiles, generalised locations, and the aggregate transparency RPC.
- Verified participant organisations can access operational rows relevant to their own offers or matches.
- Research outputs are aggregated and anonymised; they contain no contact or exact-location fields.
- Platform-administrator operations are separated from organisation-member access.
- Browser code uses only publishable credentials; no service-role credential is used by the application.

See [`docs/row-level-security.md`](docs/row-level-security.md) and `/data-governance` for the complete access model.

## Impact and organisation health

Impact is calculated only from `delivered` resource events with delivery evidence. The dashboard reports redistributed food, meals equivalent, estimated financial value, estimated CO2e avoided, landfill diversion, recipient organisations supported, and collection success rate. It can be filtered by date, city, organisation type, and food category.

All editable factors live in `src/config/impact-assumptions.ts` under the version `demo-v2-delivered-only`:

| Demonstration assumption | Value |
| --- | ---: |
| Meals per kilogram | 2.4 |
| Financial value per kilogram | EUR 5.75 |
| Landfill-diversion share | 92% |
| CO2e avoided per kilogram | 2.15 kg CO2e |

Figures are visibly labelled as demonstration estimates and the formulas are shown in the UI and exports. They are illustrative, not audited or suitable for policy evaluation.

Organisation health is intentionally not reduced to one opaque score. The UI shows pickup completion rate, average response time, successful delivery rate, cancelled match rate, data completeness, and verification status, with the numerator, denominator, and calculation described for each component.

## Server services and adapters

Route Handlers are thin boundaries around server-only services:

| Route | Purpose |
| --- | --- |
| `GET /api/resource-events` | List participant-accessible resource events |
| `GET /api/resource-events/[id]` | Read one participant-accessible event |
| `POST /api/resource-events/[id]/transition` | Execute an authorised guarded transition |
| `GET /api/audit-events` | Read immutable audit evidence for an accessible event |
| `POST /api/matches` | Recompute and persist an eligible match |
| `GET /api/impact-summary` | Build a delivered-only impact summary |
| `GET /api/transparency` | Return aggregate, anonymised public statistics |

Server functions live in `src/server/services`. Future CULTIVATE tool integrations have narrow contracts in `src/server/adapters/types.ts`:

- map adapter: generalises operational coordinates;
- calculator adapter: calculates versioned impact estimates;
- governance adapter: supplies contextual governance guidance;
- engagement-library adapter: searches reusable engagement resources;
- community-of-practice adapter: supplies events, resources, requests, and activity.

`src/server/adapters/mock-adapters.ts` provides fictional implementations today. A future integration can replace one adapter at a time without changing pages or exposing credentials to the browser.

## Repository structure

```text
src/
├── app/                    Pages, Route Handlers, loading, error, and not-found UI
├── components/             Shared shell, navigation, and UI primitives
├── config/                 Versioned impact assumptions
├── data/                   Supabase repository, safe demo mapping, and selectors
├── features/               Dashboard, workflow, impact, matching, map, and reporting
├── lib/                    Date, format, and Supabase boundaries
├── server/
│   ├── adapters/           Future integration contracts and mock adapters
│   └── services/           Authenticated and public server-side use cases
└── types/                  Domain and generated database contracts
supabase/
├── migrations/             Additive schema, triggers, grants, functions, and RLS
├── config.toml             Local Supabase configuration
└── seed.sql                Fictional, relative-date demonstration data
docs/row-level-security.md  Access policy and deployment notes
tests/e2e/                  UI, calculation, schema, date, and privacy checks
```

## Safe migration and deployment

The two resource-event migrations are additive:

1. `202607190001_resource_event_spine.sql` creates the enum, resource spine, delivery evidence, audit trail, links, triggers, indexes, and data-preserving backfill.
2. `202607190002_resource_event_rls.sql` enables RLS, applies participant policies and restricted grants, and creates guarded transition and aggregate transparency functions.

Apply them to a staging copy before production:

```bash
npx supabase link --project-ref <project-ref>
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
npm run db:types
npm run db:verify
```

Back up the remote project first, review the dry run, and validate representative donor, recipient, public, and administrator sessions. The main migration risks are trigger interaction with custom legacy writes, the backfilled status mapping, and newly restricted direct access to operational tables. The migration keeps existing tables and IDs, is idempotent where practical, and does not disable RLS. Do not load `supabase/seed.sql` into a live production database; it is for disposable fictional demonstration environments.

## Demonstration limitations

- All identities, locations, capacity figures, workflow events, and Community of Practice items are invented.
- Public locations are city-level or coordinate-generalised; they are not pickup instructions.
- The role switcher does not impersonate users or bypass RLS.
- Demo workflow mutation buttons do not alter production records.
- Matching uses transparent rules, not AI, and must be operationally reviewed.
- Impact factors are illustrative and not lifecycle-assessment, financial, or regulatory evidence.
- Small fictional samples cannot support causal, comparative, or performance claims.
- A production launch still requires identity verification, consent and retention policies, incident procedures, monitoring, backups, and organisation-specific acceptance testing.

Before merging or deploying, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:lint
npm run db:verify
```
