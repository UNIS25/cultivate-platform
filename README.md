# CULTIVATE Next

CULTIVATE Next is a production-shaped MVP demonstrating how food-sharing discovery, impact calculation, governance guidance, citizen engagement, a Community of Practice, and operational surplus matching can work as one platform.

All organisations, contacts, offers, outcomes, and recommendations in this repository are fictional demonstration data. The project does not copy CULTIVATE branding, databases, or proprietary content.

## Current scope

The application reads and writes operational data through Supabase. There is no runtime JSON fallback; without public Supabase credentials the routes remain build-safe and show an explicit connection notice.

| Route | Capability |
| --- | --- |
| `/` | Operational dashboard, urgent surplus, match summary, and network readiness |
| `/map` | Interactive Leaflet map with initiative, donor, recipient, and active-surplus layers |
| `/initiatives/[slug]` | Dynamic Supabase-backed initiative profiles |
| `/report` | Three-step surplus report with live estimates and authenticated Supabase persistence |
| `/matches` | Explainable ranked matches with authenticated match persistence |
| `/recommendations` | Supabase-backed governance and engagement resources plus practice exchange |
| `/impact` | Completed-collection metrics, transparent demo assumptions, charts, and CSV export |

The six top-level routes appear in the desktop, drawer, and mobile navigation. Initiative profiles are linked secondary routes.

## Technology

- Next.js App Router and React
- Strict TypeScript
- Tailwind CSS
- Supabase Postgres, Auth, SSR clients, migrations, seed data, and RLS
- Leaflet with OpenStreetMap tiles
- Recharts for impact visualisation
- Lucide icons
- Playwright for desktop and mobile smoke coverage

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer
- Docker Desktop or another Docker-compatible runtime for the local Supabase stack
- Google Chrome for the included end-to-end test configuration

## Installation

```bash
npm install
npm run db:start
npm run db:reset
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy the local API URL and publishable/anonymous key reported by `npm run db:start` into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable or anon key>
```

The compatibility variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted. Do not add a `service_role` key to a `NEXT_PUBLIC_*` variable.

To use another Leaflet-compatible tile service instead of the OpenStreetMap development fallback:

```bash
NEXT_PUBLIC_MAP_TILE_URL=https://your-map-provider.example/{z}/{x}/{y}.png
```

The fallback uses the public OpenStreetMap tile endpoint with attribution. A deployed or higher-traffic environment should configure a tile provider whose usage policy fits the deployment.

## Scripts

```bash
npm run dev        # Start the local development server
npm run lint       # Run ESLint
npm run typecheck  # Run strict TypeScript checking
npm run build      # Create and validate a production build
npm run start      # Serve the production build
npm run test:e2e   # Run Chrome smoke tests at desktop and mobile sizes
npm run db:start   # Start the pinned local Supabase stack
npm run db:reset   # Reapply migrations and fictional seed data
npm run db:lint    # Run Supabase database linting against the local stack
npm run db:types   # Regenerate TypeScript database types from local Postgres
npm run db:verify  # Verify anonymous RLS behavior and fictional seed counts
npm run db:stop    # Stop the local Supabase stack
```

The test suite expects an application already running on `http://localhost:3000`. Schema, RLS structure, seed counts, domain calculations, route rendering, and responsive navigation run without credentials. Data-dependent browser tests run when the Supabase public variables are present. Authenticated mutation coverage additionally requires `SUPABASE_E2E_AUTH=1` and a coordinator session supplied by the test environment.

## Demonstration data

`supabase/seed.sql` contains fictional demonstration records for a clean local reset:

```text
20 initiative organisations
10 donor organisations
10 recipient organisations
40 generalised organisation locations
20 surplus listings
3 completed collections and public impact snapshots
4 governance resources and 4 engagement resources
```

Entity contracts live in `src/types/domain.ts`; checked-in database types live in `src/types/database.ts`. `src/data/repository.ts` maps normalized database rows into domain objects, while `src/data/selectors.ts` contains pure dashboard and matching selectors. Listing reports and accepted matches use authenticated Route Handlers and are subject to RLS.

## Architecture

```text
src/
├── app/                    Route composition, metadata, loading, and error states
├── components/
│   ├── shell/              Live status shell, responsive navigation, and command palette
│   └── ui/                 Shared badge, button, logo, header, and metric primitives
├── data/                   Supabase repositories, row mappers, and pure selectors
├── features/
│   ├── impact/             Pure calculations, derived charts, and CSV export
│   ├── map/                Leaflet lifecycle, markers, filtering, and selection
│   ├── matching/           Recommendation review and Supabase persistence
│   ├── recommendations/    Governance and engagement interactions
│   └── surplus/            Multi-step report and calculator
├── lib/
│   └── supabase/           Browser/server clients and environment validation
└── types/                  Domain and generated-style database contracts
supabase/
├── migrations/             Normalized schema, triggers, grants, and RLS policies
├── config.toml             Local Supabase project configuration
└── seed.sql                Fictional demonstration seed
docs/row-level-security.md  Policy catalogue and authorization model
tests/e2e/                  Cross-route and workflow smoke tests
```

Dynamic Server Components load data through cookie-aware `@supabase/ssr` clients. Client Components remain limited to stateful workflows, charts, the map, and responsive navigation. `src/proxy.ts` refreshes Auth cookies without exposing privileged credentials.

## Matching model

The MVP intentionally uses an explainable rules engine rather than an AI or machine-learning model. It ranks every recipient, keeps failed requirements visible, and scores six published factors:

| Factor | Weight |
| --- | ---: |
| Collection distance | 25% |
| Recipient capacity | 20% |
| Food-category compatibility | 20% |
| Refrigeration requirement | 15% |
| Opening-hours overlap | 10% |
| Collection-deadline feasibility | 10% |

Category, refrigeration, opening-hours, and deadline failures are explicit eligibility blockers. Distance uses geographic coordinates; deadline feasibility combines the collection window with an illustrative travel-time estimate. Every factor exposes points, maximum points, and an explanation. An authenticated donor coordinator can accept an eligible recommendation; the server recomputes the score and stores its full factor snapshot in `matches`.

## Impact calculations

The impact dashboard treats listings with a `Collected` status as its reporting boundary. Redistributed kilograms, completed collections, and unique linked recipients are direct demonstration-record totals. Estimated meals, financial value, and waste avoided are then derived from those kilograms.

Every conversion factor is an editable demonstration assumption in one file: `src/config/impact-assumptions.ts`. The current `demo-v1` configuration contains:

| Demonstration assumption | Value | Used by |
| --- | ---: | --- |
| Meals per kilogram | 2.4 | Impact dashboard and surplus report calculator |
| Financial value per kilogram | EUR 5.75 | Impact dashboard |
| Waste avoidance rate | 92% | Impact dashboard |
| CO2e avoided per kilogram | 2.15 kg CO2e | Surplus report calculator only |

The formulas are implemented as pure functions in `src/features/impact/calculations.ts`. Collected demo listings include a recipient link and completion timestamp so totals can be traced to the collection log. The dashboard labels calculated metrics as `Demo estimate`, displays each factor and formula, and includes both assumptions and source records in its CSV export. None of these values are audited claims.

## Database and RLS

The migrations create the requested `organisations`, `organisation_locations`, `surplus_listings`, `food_categories`, `matches`, `collections`, `impact_records`, `governance_resources`, `engagement_resources`, and `users` tables. `organisation_food_categories` is the normalized many-to-many capability table.

The initial migration also adds constraints, indexes, Auth profile provisioning, immutable score evidence, collection-party validation, collection/listing synchronization, and impact assumption snapshots. The second migration enables RLS on every application table and applies named policies for anonymous discovery, organisation members, coordinators/admins, and platform admins.

The complete policy catalogue, helper functions, status guards, grants, and administrative assignment process are documented in [`docs/row-level-security.md`](docs/row-level-security.md).

For a remote project, link the CLI and apply migrations through the normal controlled deployment flow:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Review `supabase/seed.sql` before loading it outside a disposable demonstration environment. No Supabase service key is required by the application and none should ever be exposed to the browser.

## Quality and accessibility

- Keyboard-visible focus states and semantic controls
- Keyboard command search with `Ctrl/Command + K`
- Reduced-motion support
- Responsive layouts tested at 1440×1000 and 390×844
- No horizontal overflow across the six primary routes
- Exact OpenStreetMap attribution and configurable tile source
- Dynamic initiative profiles protected by the same Supabase data boundary
- Loading and not-found states

Before merging changes, run:

```bash
npm run lint && npm run typecheck && npm run build && npm run test:e2e
```

At the time of this build, `npm audit --omit=dev` reports a moderate PostCSS advisory in Next.js's pinned internal build dependency. npm proposes an incompatible downgrade rather than a valid patched Next.js release. Track and update Next.js when an upstream release carries the patched dependency; do not apply the suggested forced downgrade.
