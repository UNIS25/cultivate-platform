do $seed$
begin

insert into public.food_categories (id, slug, name, description, sort_order)
values
  (md5('cultivate-next:category:Bakery')::uuid, 'bakery', 'Bakery', 'Bread, pastries and baked goods.', 10),
  (md5('cultivate-next:category:Produce')::uuid, 'produce', 'Produce', 'Fresh fruit, vegetables and herbs.', 20),
  (md5('cultivate-next:category:Prepared meals')::uuid, 'prepared-meals', 'Prepared meals', 'Prepared food requiring appropriate handling.', 30),
  (md5('cultivate-next:category:Dairy')::uuid, 'dairy', 'Dairy', 'Chilled dairy products.', 40),
  (md5('cultivate-next:category:Pantry')::uuid, 'pantry', 'Pantry', 'Shelf-stable groceries and ingredients.', 50),
  (md5('cultivate-next:category:Mixed')::uuid, 'mixed', 'Mixed', 'Offers containing more than one food category.', 60)
on conflict (id) do nothing;

create temporary table seed_initiatives on commit preserve rows as
select *
from jsonb_to_recordset($initiatives$[
  {"id":"init-01","slug":"harbour-share-hub","name":"Harbour Share Hub","city":"Dublin","country":"Ireland","latitude":53.3498,"longitude":-6.2603,"type":"Food hub","status":"Active","description":"A neighbourhood-led collection and redistribution point coordinating shops, volunteers and community kitchens.","categories":["Produce","Bakery","Pantry"],"weeklyCapacityKg":820,"activeVolunteers":34,"householdsReached":286,"governanceScore":82,"verified":true,"nextCollection":"Today, 17:30"},
  {"id":"init-02","slug":"lee-valley-table","name":"Lee Valley Table","city":"Cork","country":"Ireland","latitude":51.8985,"longitude":-8.4756,"type":"Social kitchen","status":"Active","description":"A shared kitchen turning short-dated ingredients into free evening meals.","categories":["Produce","Prepared meals","Dairy"],"weeklyCapacityKg":540,"activeVolunteers":22,"householdsReached":174,"governanceScore":76,"verified":true,"nextCollection":"Tomorrow, 09:00"},
  {"id":"init-03","slug":"foyle-community-pantry","name":"Foyle Community Pantry","city":"Derry","country":"Ireland","latitude":54.9966,"longitude":-7.3086,"type":"Community fridge","status":"Pilot","description":"A pilot pantry offering dignified access to rescued food through local referrals.","categories":["Bakery","Pantry","Dairy"],"weeklyCapacityKg":310,"activeVolunteers":15,"householdsReached":96,"governanceScore":63,"verified":false,"nextCollection":"Tue, 13:00"},
  {"id":"init-04","slug":"brussels-common-plate","name":"Brussels Common Plate","city":"Brussels","country":"Belgium","latitude":50.8503,"longitude":4.3517,"type":"Redistribution network","status":"Active","description":"A multilingual network matching institutional kitchens with frontline community groups.","categories":["Mixed","Prepared meals","Produce"],"weeklyCapacityKg":1260,"activeVolunteers":47,"householdsReached":420,"governanceScore":89,"verified":true,"nextCollection":"Today, 16:00"},
  {"id":"init-05","slug":"gent-groente-deel","name":"Gent Groente Deel","city":"Ghent","country":"Belgium","latitude":51.0543,"longitude":3.7174,"type":"Food hub","status":"Seasonal","description":"Seasonal produce recovery with growers and neighbourhood distribution teams.","categories":["Produce"],"weeklyCapacityKg":690,"activeVolunteers":28,"householdsReached":210,"governanceScore":71,"verified":true,"nextCollection":"Sat, 08:30"},
  {"id":"init-06","slug":"north-dock-fridge","name":"North Dock Fridge","city":"Rotterdam","country":"Netherlands","latitude":51.9244,"longitude":4.4777,"type":"Community fridge","status":"Active","description":"A monitored community fridge serving dockside neighbourhoods and student volunteers.","categories":["Dairy","Produce","Bakery"],"weeklyCapacityKg":440,"activeVolunteers":19,"householdsReached":152,"governanceScore":78,"verified":true,"nextCollection":"Today, 19:00"},
  {"id":"init-07","slug":"utrecht-circular-kitchen","name":"Utrecht Circular Kitchen","city":"Utrecht","country":"Netherlands","latitude":52.0907,"longitude":5.1214,"type":"Social kitchen","status":"Active","description":"A training kitchen creating affordable lunches from safe surplus ingredients.","categories":["Prepared meals","Produce","Pantry"],"weeklyCapacityKg":730,"activeVolunteers":31,"householdsReached":248,"governanceScore":85,"verified":true,"nextCollection":"Tomorrow, 10:30"},
  {"id":"init-08","slug":"porto-neighbourhood-table","name":"Porto Neighbourhood Table","city":"Porto","country":"Portugal","latitude":41.1579,"longitude":-8.6291,"type":"Social kitchen","status":"Active","description":"Local cooks and civil-society groups share weekly meals across three neighbourhoods.","categories":["Prepared meals","Produce","Mixed"],"weeklyCapacityKg":610,"activeVolunteers":26,"householdsReached":233,"governanceScore":74,"verified":true,"nextCollection":"Wed, 11:00"},
  {"id":"init-09","slug":"lisbon-loop","name":"Lisbon Loop","city":"Lisbon","country":"Portugal","latitude":38.7223,"longitude":-9.1393,"type":"Redistribution network","status":"Pilot","description":"A city-scale pilot connecting market traders with community-led recipient groups.","categories":["Produce","Bakery","Mixed"],"weeklyCapacityKg":980,"activeVolunteers":38,"householdsReached":318,"governanceScore":68,"verified":false,"nextCollection":"Today, 18:00"},
  {"id":"init-10","slug":"malmo-matdelning","name":"Malmö Matdelning","city":"Malmö","country":"Sweden","latitude":55.605,"longitude":13.0038,"type":"Food hub","status":"Active","description":"A low-carbon cargo-bike network distributing rescued food to local associations.","categories":["Bakery","Produce","Dairy"],"weeklyCapacityKg":760,"activeVolunteers":42,"householdsReached":301,"governanceScore":91,"verified":true,"nextCollection":"Tomorrow, 08:00"},
  {"id":"init-11","slug":"aarhus-share-shelf","name":"Aarhus Share Shelf","city":"Aarhus","country":"Denmark","latitude":56.1629,"longitude":10.2039,"type":"Community fridge","status":"Active","description":"Shared refrigerated storage hosted by a civic centre and managed by residents.","categories":["Dairy","Bakery","Produce"],"weeklyCapacityKg":390,"activeVolunteers":18,"householdsReached":144,"governanceScore":80,"verified":true,"nextCollection":"Thu, 15:30"},
  {"id":"init-12","slug":"helsinki-open-pantry","name":"Helsinki Open Pantry","city":"Helsinki","country":"Finland","latitude":60.1699,"longitude":24.9384,"type":"Food hub","status":"Active","description":"An accessible food hub coordinating collection windows through public libraries.","categories":["Pantry","Bakery","Mixed"],"weeklyCapacityKg":670,"activeVolunteers":29,"householdsReached":224,"governanceScore":87,"verified":true,"nextCollection":"Fri, 12:00"},
  {"id":"init-13","slug":"tallinn-shared-kitchen","name":"Tallinn Shared Kitchen","city":"Tallinn","country":"Estonia","latitude":59.437,"longitude":24.7536,"type":"Social kitchen","status":"Pilot","description":"A small kitchen trial pairing hospitality trainees with food recovery volunteers.","categories":["Prepared meals","Pantry","Produce"],"weeklyCapacityKg":360,"activeVolunteers":17,"householdsReached":119,"governanceScore":66,"verified":false,"nextCollection":"Mon, 10:00"},
  {"id":"init-14","slug":"ljubljana-harvest-link","name":"Ljubljana Harvest Link","city":"Ljubljana","country":"Slovenia","latitude":46.0569,"longitude":14.5058,"type":"Redistribution network","status":"Seasonal","description":"A harvest-season network connecting peri-urban growers and social support teams.","categories":["Produce","Pantry"],"weeklyCapacityKg":880,"activeVolunteers":37,"householdsReached":272,"governanceScore":73,"verified":true,"nextCollection":"Sat, 07:30"},
  {"id":"init-15","slug":"bologna-civic-table","name":"Bologna Civic Table","city":"Bologna","country":"Italy","latitude":44.4949,"longitude":11.3426,"type":"Food hub","status":"Active","description":"A partnership of markets, cooperatives and civic kitchens with daily collections.","categories":["Produce","Bakery","Prepared meals"],"weeklyCapacityKg":1150,"activeVolunteers":51,"householdsReached":408,"governanceScore":88,"verified":true,"nextCollection":"Today, 14:30"},
  {"id":"init-16","slug":"valencia-sun-kitchen","name":"Valencia Sun Kitchen","city":"Valencia","country":"Spain","latitude":39.4699,"longitude":-0.3763,"type":"Social kitchen","status":"Active","description":"Community cooks prepare family portions from market and catering surplus.","categories":["Produce","Prepared meals","Mixed"],"weeklyCapacityKg":790,"activeVolunteers":33,"householdsReached":295,"governanceScore":79,"verified":true,"nextCollection":"Tomorrow, 12:30"},
  {"id":"init-17","slug":"zagreb-food-circle","name":"Zagreb Food Circle","city":"Zagreb","country":"Croatia","latitude":45.815,"longitude":15.9819,"type":"Redistribution network","status":"Pilot","description":"A volunteer dispatch network testing shared collection routes with small retailers.","categories":["Bakery","Produce","Pantry"],"weeklyCapacityKg":520,"activeVolunteers":24,"householdsReached":181,"governanceScore":61,"verified":false,"nextCollection":"Wed, 16:00"},
  {"id":"init-18","slug":"prague-common-fridge","name":"Prague Common Fridge","city":"Prague","country":"Czechia","latitude":50.0755,"longitude":14.4378,"type":"Community fridge","status":"Active","description":"A set of staffed public fridges with coordinated food-safety checks.","categories":["Dairy","Bakery","Produce"],"weeklyCapacityKg":470,"activeVolunteers":21,"householdsReached":165,"governanceScore":83,"verified":true,"nextCollection":"Today, 20:00"},
  {"id":"init-19","slug":"leipzig-fair-share","name":"Leipzig Fair Share","city":"Leipzig","country":"Germany","latitude":51.3397,"longitude":12.3731,"type":"Food hub","status":"Active","description":"A member-run hub combining redistribution, workshops and shared storage.","categories":["Mixed","Pantry","Produce"],"weeklyCapacityKg":930,"activeVolunteers":45,"householdsReached":336,"governanceScore":86,"verified":true,"nextCollection":"Tomorrow, 15:00"},
  {"id":"init-20","slug":"krakow-neighbourhood-store","name":"Kraków Neighbourhood Store","city":"Kraków","country":"Poland","latitude":50.0647,"longitude":19.945,"type":"Food hub","status":"Seasonal","description":"A solidarity store coordinating winter food recovery and household referrals.","categories":["Pantry","Bakery","Mixed"],"weeklyCapacityKg":640,"activeVolunteers":27,"householdsReached":238,"governanceScore":70,"verified":true,"nextCollection":"Fri, 09:30"}
]$initiatives$::jsonb) as source(
  id text,
  slug text,
  name text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  type text,
  status text,
  description text,
  categories jsonb,
  "weeklyCapacityKg" numeric,
  "activeVolunteers" integer,
  "householdsReached" integer,
  "governanceScore" integer,
  verified boolean,
  "nextCollection" text
);

create temporary table seed_donors on commit preserve rows as
select *
from jsonb_to_recordset($donors$[
  {"id":"donor-01","name":"Liffey Fresh Market","type":"Supermarket","city":"Dublin","country":"Ireland","latitude":53.346,"longitude":-6.267,"contactName":"Nora Byrne","reliabilityScore":96,"donationsThisMonth":18},
  {"id":"donor-02","name":"Riverbank Bakehouse","type":"Bakery","city":"Cork","country":"Ireland","latitude":51.901,"longitude":-8.468,"contactName":"Eoin Carey","reliabilityScore":91,"donationsThisMonth":14},
  {"id":"donor-03","name":"Canal Street Catering","type":"Caterer","city":"Brussels","country":"Belgium","latitude":50.855,"longitude":4.36,"contactName":"Lina Peeters","reliabilityScore":89,"donationsThisMonth":11},
  {"id":"donor-04","name":"Green Quay Produce","type":"Wholesaler","city":"Rotterdam","country":"Netherlands","latitude":51.918,"longitude":4.49,"contactName":"Sam de Wit","reliabilityScore":94,"donationsThisMonth":21},
  {"id":"donor-05","name":"Atlantic Pantry Co-op","type":"Supermarket","city":"Porto","country":"Portugal","latitude":41.15,"longitude":-8.62,"contactName":"Marta Reis","reliabilityScore":87,"donationsThisMonth":9},
  {"id":"donor-06","name":"Öresund Daily Bread","type":"Bakery","city":"Malmö","country":"Sweden","latitude":55.61,"longitude":13.01,"contactName":"Elin Holm","reliabilityScore":98,"donationsThisMonth":25},
  {"id":"donor-07","name":"Baltic Harvest Farm","type":"Farm","city":"Tallinn","country":"Estonia","latitude":59.43,"longitude":24.74,"contactName":"Maarja Tamm","reliabilityScore":85,"donationsThisMonth":8},
  {"id":"donor-08","name":"Portico Events Kitchen","type":"Caterer","city":"Bologna","country":"Italy","latitude":44.5,"longitude":11.35,"contactName":"Giulia Conti","reliabilityScore":92,"donationsThisMonth":16},
  {"id":"donor-09","name":"Turia Growers Collective","type":"Farm","city":"Valencia","country":"Spain","latitude":39.48,"longitude":-0.39,"contactName":"Pau Ferrer","reliabilityScore":90,"donationsThisMonth":13},
  {"id":"donor-10","name":"Saxon Food Exchange","type":"Wholesaler","city":"Leipzig","country":"Germany","latitude":51.35,"longitude":12.38,"contactName":"Mia Vogel","reliabilityScore":93,"donationsThisMonth":19}
]$donors$::jsonb) as source(
  id text,
  name text,
  type text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  "contactName" text,
  "reliabilityScore" integer,
  "donationsThisMonth" integer
);

create temporary table seed_recipients on commit preserve rows as
select *
from jsonb_to_recordset($recipients$[
  {"id":"recipient-01","name":"Northside Family Kitchen","type":"Community kitchen","city":"Dublin","country":"Ireland","latitude":53.358,"longitude":-6.255,"contactName":"Aoife Walsh","acceptedCategories":["Produce","Bakery","Prepared meals","Pantry"],"capacityKg":180,"refrigeration":true,"householdsSupported":84,"timeZone":"Europe/Dublin","openingHours":{"days":["Mon","Tue","Wed","Thu","Fri","Sat"],"opensAt":"08:00","closesAt":"20:00"}},
  {"id":"recipient-02","name":"Cork Welcome Centre","type":"Shelter","city":"Cork","country":"Ireland","latitude":51.895,"longitude":-8.482,"contactName":"Tadhg Flynn","acceptedCategories":["Prepared meals","Bakery","Dairy","Pantry"],"capacityKg":120,"refrigeration":true,"householdsSupported":52,"timeZone":"Europe/Dublin","openingHours":{"days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"opensAt":"07:00","closesAt":"22:00"}},
  {"id":"recipient-03","name":"Maison du Quartier Nord","type":"Food bank","city":"Brussels","country":"Belgium","latitude":50.86,"longitude":4.35,"contactName":"Amélie Laurent","acceptedCategories":["Mixed","Produce","Bakery","Pantry"],"capacityKg":240,"refrigeration":true,"householdsSupported":126,"timeZone":"Europe/Brussels","openingHours":{"days":["Mon","Tue","Wed","Thu","Fri","Sat"],"opensAt":"08:30","closesAt":"18:30"}},
  {"id":"recipient-04","name":"Nieuwe Haven Youth House","type":"Youth centre","city":"Rotterdam","country":"Netherlands","latitude":51.93,"longitude":4.47,"contactName":"Noah Jansen","acceptedCategories":["Produce","Bakery","Dairy","Prepared meals"],"capacityKg":95,"refrigeration":true,"householdsSupported":47,"timeZone":"Europe/Amsterdam","openingHours":{"days":["Mon","Tue","Wed","Thu","Fri"],"opensAt":"10:00","closesAt":"21:00"}},
  {"id":"recipient-05","name":"Bonfim Mutual Support","type":"Mutual aid group","city":"Porto","country":"Portugal","latitude":41.16,"longitude":-8.61,"contactName":"Inês Sousa","acceptedCategories":["Mixed","Produce","Pantry","Bakery"],"capacityKg":150,"refrigeration":false,"householdsSupported":73,"timeZone":"Europe/Lisbon","openingHours":{"days":["Tue","Wed","Thu","Fri","Sat"],"opensAt":"09:00","closesAt":"19:00"}},
  {"id":"recipient-06","name":"Folkets Community Pantry","type":"Food bank","city":"Malmö","country":"Sweden","latitude":55.6,"longitude":13.0,"contactName":"Oskar Lind","acceptedCategories":["Bakery","Produce","Dairy","Pantry"],"capacityKg":210,"refrigeration":true,"householdsSupported":108,"timeZone":"Europe/Stockholm","openingHours":{"days":["Mon","Tue","Wed","Thu","Fri","Sat"],"opensAt":"08:00","closesAt":"20:00"}},
  {"id":"recipient-07","name":"Kalamaja Family Network","type":"Mutual aid group","city":"Tallinn","country":"Estonia","latitude":59.445,"longitude":24.73,"contactName":"Rasmus Saar","acceptedCategories":["Produce","Pantry","Mixed"],"capacityKg":130,"refrigeration":false,"householdsSupported":61,"timeZone":"Europe/Tallinn","openingHours":{"days":["Mon","Tue","Wed","Thu","Fri"],"opensAt":"09:00","closesAt":"18:00"}},
  {"id":"recipient-08","name":"Navile Community Canteen","type":"Community kitchen","city":"Bologna","country":"Italy","latitude":44.51,"longitude":11.34,"contactName":"Luca Rizzi","acceptedCategories":["Prepared meals","Produce","Bakery","Mixed"],"capacityKg":200,"refrigeration":true,"householdsSupported":97,"timeZone":"Europe/Rome","openingHours":{"days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"opensAt":"07:30","closesAt":"21:00"}},
  {"id":"recipient-09","name":"Cabanyal Neighbourhood Aid","type":"Food bank","city":"Valencia","country":"Spain","latitude":39.47,"longitude":-0.35,"contactName":"Clara Martí","acceptedCategories":["Produce","Mixed","Pantry","Bakery"],"capacityKg":175,"refrigeration":true,"householdsSupported":89,"timeZone":"Europe/Madrid","openingHours":{"days":["Mon","Tue","Wed","Thu","Fri","Sat"],"opensAt":"08:00","closesAt":"20:00"}},
  {"id":"recipient-10","name":"Ost Civic Shelter","type":"Shelter","city":"Leipzig","country":"Germany","latitude":51.34,"longitude":12.4,"contactName":"Jonas Richter","acceptedCategories":["Mixed","Prepared meals","Pantry","Dairy"],"capacityKg":160,"refrigeration":true,"householdsSupported":76,"timeZone":"Europe/Berlin","openingHours":{"days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"opensAt":"00:00","closesAt":"23:59"}}
]$recipients$::jsonb) as source(
  id text,
  name text,
  type text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  "contactName" text,
  "acceptedCategories" jsonb,
  "capacityKg" numeric,
  refrigeration boolean,
  "householdsSupported" integer,
  "timeZone" text,
  "openingHours" jsonb
);

create temporary table seed_surplus on commit preserve rows as
select *
from jsonb_to_recordset($surplus$[
  {"id":"surplus-001","donorId":"donor-01","title":"Seasonal vegetables","category":"Produce","quantityKg":86,"portions":172,"availableFrom":"2026-07-18T15:00:00Z","collectBy":"2026-07-18T19:00:00Z","status":"Available","handling":"Ambient","city":"Dublin","latitude":53.346,"longitude":-6.267,"notes":"Mixed courgettes, peppers and carrots in stackable crates."},
  {"id":"surplus-002","donorId":"donor-01","title":"Deli sandwiches","category":"Prepared meals","quantityKg":34,"portions":92,"availableFrom":"2026-07-18T17:30:00Z","collectBy":"2026-07-18T20:00:00Z","status":"Reserved","handling":"Chilled","city":"Dublin","latitude":53.346,"longitude":-6.267,"notes":"Individually labelled; mixed vegetarian and chicken fillings."},
  {"id":"surplus-003","donorId":"donor-02","title":"Sourdough and rolls","category":"Bakery","quantityKg":42,"portions":126,"availableFrom":"2026-07-18T17:00:00Z","collectBy":"2026-07-19T09:00:00Z","status":"Available","handling":"Ambient","city":"Cork","latitude":51.901,"longitude":-8.468,"notes":"Packed in food-safe paper sacks."},
  {"id":"surplus-004","donorId":"donor-02","recipientId":"recipient-02","title":"Breakfast pastries","category":"Bakery","quantityKg":18,"portions":72,"availableFrom":"2026-07-18T16:30:00Z","collectBy":"2026-07-18T19:30:00Z","collectedAt":"2026-07-18T18:42:00Z","status":"Collected","handling":"Ambient","city":"Cork","latitude":51.901,"longitude":-8.468,"notes":"Contains gluten, dairy and nuts."},
  {"id":"surplus-005","donorId":"donor-03","title":"Conference lunch trays","category":"Prepared meals","quantityKg":64,"portions":118,"availableFrom":"2026-07-18T14:00:00Z","collectBy":"2026-07-18T18:00:00Z","status":"Available","handling":"Chilled","city":"Brussels","latitude":50.855,"longitude":4.36,"notes":"Vegetarian grain bowls kept below 5°C."},
  {"id":"surplus-006","donorId":"donor-03","title":"Unopened yoghurt pots","category":"Dairy","quantityKg":27,"portions":108,"availableFrom":"2026-07-19T08:00:00Z","collectBy":"2026-07-19T12:00:00Z","status":"Reserved","handling":"Chilled","city":"Brussels","latitude":50.855,"longitude":4.36,"notes":"Use-by date 21 July; sealed multipacks."},
  {"id":"surplus-007","donorId":"donor-04","title":"Mixed salad vegetables","category":"Produce","quantityKg":112,"portions":224,"availableFrom":"2026-07-18T13:00:00Z","collectBy":"2026-07-18T17:30:00Z","status":"Available","handling":"Chilled","city":"Rotterdam","latitude":51.918,"longitude":4.49,"notes":"Lettuce, cucumber and tomatoes; cosmetic imperfections only."},
  {"id":"surplus-008","donorId":"donor-04","title":"Ripe stone fruit","category":"Produce","quantityKg":73,"portions":146,"availableFrom":"2026-07-19T06:30:00Z","collectBy":"2026-07-19T10:00:00Z","status":"Available","handling":"Ambient","city":"Rotterdam","latitude":51.918,"longitude":4.49,"notes":"Ready to eat or cook within 24 hours."},
  {"id":"surplus-009","donorId":"donor-05","title":"Rice and canned beans","category":"Pantry","quantityKg":95,"portions":285,"availableFrom":"2026-07-18T10:00:00Z","collectBy":"2026-07-20T16:00:00Z","status":"Available","handling":"Ambient","city":"Porto","latitude":41.15,"longitude":-8.62,"notes":"Outer cartons damaged; primary packaging intact."},
  {"id":"surplus-010","donorId":"donor-05","title":"Assorted grocery crates","category":"Mixed","quantityKg":58,"portions":140,"availableFrom":"2026-07-19T09:00:00Z","collectBy":"2026-07-19T15:00:00Z","status":"Reserved","handling":"Ambient","city":"Porto","latitude":41.15,"longitude":-8.62,"notes":"Shelf-stable foods with full ingredient labels."},
  {"id":"surplus-011","donorId":"donor-06","title":"Rye loaves","category":"Bakery","quantityKg":67,"portions":201,"availableFrom":"2026-07-18T18:00:00Z","collectBy":"2026-07-19T08:30:00Z","status":"Available","handling":"Ambient","city":"Malmö","latitude":55.61,"longitude":13.01,"notes":"Unsliced loaves in reusable bakery crates."},
  {"id":"surplus-012","donorId":"donor-06","recipientId":"recipient-06","title":"Cardamom buns","category":"Bakery","quantityKg":21,"portions":84,"availableFrom":"2026-07-18T18:00:00Z","collectBy":"2026-07-18T21:00:00Z","collectedAt":"2026-07-18T20:18:00Z","status":"Collected","handling":"Ambient","city":"Malmö","latitude":55.61,"longitude":13.01,"notes":"Contains gluten and dairy."},
  {"id":"surplus-013","donorId":"donor-07","title":"New-season potatoes","category":"Produce","quantityKg":140,"portions":280,"availableFrom":"2026-07-19T07:00:00Z","collectBy":"2026-07-20T12:00:00Z","status":"Available","handling":"Ambient","city":"Tallinn","latitude":59.43,"longitude":24.74,"notes":"Washed and packed in 10 kg sacks."},
  {"id":"surplus-014","donorId":"donor-07","title":"Carrots and beetroot","category":"Produce","quantityKg":88,"portions":176,"availableFrom":"2026-07-19T07:00:00Z","collectBy":"2026-07-20T12:00:00Z","status":"Reserved","handling":"Ambient","city":"Tallinn","latitude":59.43,"longitude":24.74,"notes":"Mixed grade, suitable for cooking."},
  {"id":"surplus-015","donorId":"donor-08","title":"Pasta meal portions","category":"Prepared meals","quantityKg":78,"portions":156,"availableFrom":"2026-07-18T15:30:00Z","collectBy":"2026-07-18T19:00:00Z","status":"Available","handling":"Chilled","city":"Bologna","latitude":44.5,"longitude":11.35,"notes":"Tomato and vegetable pasta in sealed catering trays."},
  {"id":"surplus-016","donorId":"donor-08","title":"Event pantry supplies","category":"Pantry","quantityKg":46,"portions":128,"availableFrom":"2026-07-19T10:00:00Z","collectBy":"2026-07-21T14:00:00Z","status":"Available","handling":"Ambient","city":"Bologna","latitude":44.5,"longitude":11.35,"notes":"Pasta, passata and sealed cooking oils."},
  {"id":"surplus-017","donorId":"donor-09","title":"Citrus and tomatoes","category":"Produce","quantityKg":124,"portions":248,"availableFrom":"2026-07-18T12:00:00Z","collectBy":"2026-07-19T09:00:00Z","status":"Available","handling":"Ambient","city":"Valencia","latitude":39.48,"longitude":-0.39,"notes":"Harvest surplus in reusable crates."},
  {"id":"surplus-018","donorId":"donor-09","recipientId":"recipient-09","title":"Fresh herb boxes","category":"Produce","quantityKg":16,"portions":80,"availableFrom":"2026-07-18T12:00:00Z","collectBy":"2026-07-18T18:00:00Z","collectedAt":"2026-07-18T17:24:00Z","status":"Collected","handling":"Chilled","city":"Valencia","latitude":39.48,"longitude":-0.39,"notes":"Parsley, coriander and mint."},
  {"id":"surplus-019","donorId":"donor-10","title":"Chilled mixed groceries","category":"Mixed","quantityKg":83,"portions":192,"availableFrom":"2026-07-18T16:00:00Z","collectBy":"2026-07-18T20:30:00Z","status":"Available","handling":"Chilled","city":"Leipzig","latitude":51.35,"longitude":12.38,"notes":"Dairy, prepared salads and packaged vegetables."},
  {"id":"surplus-020","donorId":"donor-10","title":"Dry goods assortment","category":"Pantry","quantityKg":105,"portions":315,"availableFrom":"2026-07-19T09:30:00Z","collectBy":"2026-07-21T17:00:00Z","status":"Reserved","handling":"Ambient","city":"Leipzig","latitude":51.35,"longitude":12.38,"notes":"Rice, pulses and cereal in intact retail packs."}
]$surplus$::jsonb) as source(
  id text,
  "donorId" text,
  "recipientId" text,
  title text,
  category text,
  "quantityKg" numeric,
  portions integer,
  "availableFrom" timestamptz,
  "collectBy" timestamptz,
  "collectedAt" timestamptz,
  status text,
  handling text,
  city text,
  latitude double precision,
  longitude double precision,
  notes text
);

insert into public.organisations (
  id, legacy_id, slug, kind, name, organisation_type, status, description,
  verified, weekly_capacity_kg, active_volunteers, households_supported,
  governance_score, next_collection_label
)
select
  md5('cultivate-next:organisation:' || id)::uuid,
  id,
  slug,
  'initiative'::public.organisation_kind,
  name,
  type,
  lower(status)::public.organisation_status,
  description,
  verified,
  "weeklyCapacityKg",
  "activeVolunteers",
  "householdsReached",
  "governanceScore",
  "nextCollection"
from seed_initiatives
on conflict (id) do nothing;

insert into public.organisations (
  id, legacy_id, slug, kind, name, organisation_type, status, description,
  verified, reliability_score, donations_this_month
)
select
  md5('cultivate-next:organisation:' || id)::uuid,
  id,
  id,
  'donor'::public.organisation_kind,
  name,
  type,
  'active'::public.organisation_status,
  'Fictional demonstration food donor.',
  true,
  "reliabilityScore",
  "donationsThisMonth"
from seed_donors
on conflict (id) do nothing;

insert into public.organisations (
  id, legacy_id, slug, kind, name, organisation_type, status, description,
  verified, recipient_capacity_kg, households_supported, has_refrigeration,
  time_zone, opening_days, opens_at, closes_at
)
select
  md5('cultivate-next:organisation:' || id)::uuid,
  id,
  id,
  'recipient'::public.organisation_kind,
  name,
  type,
  'active'::public.organisation_status,
  'Fictional demonstration recipient organisation.',
  true,
  "capacityKg",
  "householdsSupported",
  refrigeration,
  "timeZone",
  array(select jsonb_array_elements_text("openingHours" -> 'days')),
  ("openingHours" ->> 'opensAt')::time,
  ("openingHours" ->> 'closesAt')::time
from seed_recipients
on conflict (id) do nothing;

insert into public.organisation_locations (
  id, organisation_id, label, city, country, latitude, longitude, visibility, is_primary
)
select
  md5('cultivate-next:location:' || id)::uuid,
  md5('cultivate-next:organisation:' || id)::uuid,
  'Primary area', city, country, latitude, longitude,
  'generalised'::public.location_visibility, true
from seed_initiatives
union all
select
  md5('cultivate-next:location:' || id)::uuid,
  md5('cultivate-next:organisation:' || id)::uuid,
  'Primary area', city, country, latitude, longitude,
  'generalised'::public.location_visibility, true
from seed_donors
union all
select
  md5('cultivate-next:location:' || id)::uuid,
  md5('cultivate-next:organisation:' || id)::uuid,
  'Primary area', city, country, latitude, longitude,
  'generalised'::public.location_visibility, true
from seed_recipients
on conflict (id) do nothing;

insert into public.organisation_food_categories (organisation_id, food_category_id)
select
  md5('cultivate-next:organisation:' || initiative.id)::uuid,
  category.id
from seed_initiatives initiative
cross join lateral jsonb_array_elements_text(initiative.categories) accepted(name)
join public.food_categories category on category.name = accepted.name
union
select
  md5('cultivate-next:organisation:' || recipient.id)::uuid,
  category.id
from seed_recipients recipient
cross join lateral jsonb_array_elements_text(recipient."acceptedCategories") accepted(name)
join public.food_categories category on category.name = accepted.name
on conflict (organisation_id, food_category_id) do nothing;

insert into public.surplus_listings (
  id, legacy_id, donor_organisation_id, recipient_organisation_id, location_id,
  food_category_id, title, quantity_kg, estimated_meals, available_from,
  collection_deadline, collected_at, status, handling, notes, published_at
)
select
  md5('cultivate-next:listing:' || surplus.id)::uuid,
  surplus.id,
  md5('cultivate-next:organisation:' || surplus."donorId")::uuid,
  case when surplus."recipientId" is null then null else md5('cultivate-next:organisation:' || surplus."recipientId")::uuid end,
  md5('cultivate-next:location:' || surplus."donorId")::uuid,
  category.id,
  surplus.title,
  surplus."quantityKg",
  surplus.portions,
  surplus."availableFrom",
  surplus."collectBy",
  surplus."collectedAt",
  lower(surplus.status)::public.listing_status,
  lower(surplus.handling)::public.food_handling,
  surplus.notes,
  surplus."availableFrom"
from seed_surplus surplus
join public.food_categories category on category.name = surplus.category
on conflict (id) do nothing;

insert into public.collections (
  id, listing_id, donor_organisation_id, recipient_organisation_id, location_id,
  status, quantity_kg, scheduled_at, completed_at, is_public, notes
)
select
  md5('cultivate-next:collection:' || id)::uuid,
  md5('cultivate-next:listing:' || id)::uuid,
  md5('cultivate-next:organisation:' || "donorId")::uuid,
  md5('cultivate-next:organisation:' || "recipientId")::uuid,
  md5('cultivate-next:location:' || "donorId")::uuid,
  'completed'::public.collection_status,
  "quantityKg",
  "collectBy",
  "collectedAt",
  true,
  'Fictional completed collection seeded for demonstration reporting.'
from seed_surplus
where status = 'Collected'
on conflict (id) do nothing;

insert into public.impact_records (
  id, collection_id, organisation_id, food_redistributed_kg, estimated_meals,
  financial_value_eur, estimated_waste_avoided_kg, estimated_co2e_avoided_kg,
  assumptions_version, assumptions_snapshot, is_public, recorded_at
)
select
  md5('cultivate-next:impact:' || id)::uuid,
  md5('cultivate-next:collection:' || id)::uuid,
  md5('cultivate-next:organisation:' || "recipientId")::uuid,
  "quantityKg",
  round("quantityKg" * 2.4),
  round("quantityKg" * 5.75, 2),
  round("quantityKg" * 0.92, 2),
  round("quantityKg" * 2.15, 2),
  'demo-v1',
  jsonb_build_object(
    'mealsPerKilogram', 2.4,
    'financialValuePerKilogramEur', 5.75,
    'wasteAvoidanceRate', 0.92,
    'co2eAvoidedPerKilogram', 2.15
  ),
  true,
  "collectedAt"
from seed_surplus
where status = 'Collected'
on conflict (id) do nothing;

insert into public.governance_resources (
  id, slug, title, summary, content, priority, area, effort_label, audience, status, published_at
)
values
  (md5('cultivate-next:governance:roles')::uuid, 'clarify-match-approval-roles', 'Clarify match approval roles', 'Document who can reserve, approve and cancel a food transfer, including out-of-hours cover.', 'Use a named responsibility matrix for every stage of the collection workflow.', 'High', 'Accountability', '45 min', 'Network coordinators', 'published', '2026-07-01T09:00:00Z'),
  (md5('cultivate-next:governance:privacy')::uuid, 'review-pickup-location-privacy', 'Review pickup-location privacy', 'Limit precise addresses and named contacts to confirmed participants in each transfer.', 'Review location visibility, participant access and retention at least quarterly.', 'High', 'Data stewardship', '1 hour', 'Data stewards', 'published', '2026-07-01T09:00:00Z'),
  (md5('cultivate-next:governance:feedback')::uuid, 'close-recipient-feedback-loop', 'Close the recipient feedback loop', 'Add a lightweight post-collection check covering quantity, quality and unmet need.', 'Record structured feedback against the completed collection without collecting unnecessary personal data.', 'Medium', 'Learning', '2 hours', 'Recipient coordinators', 'published', '2026-07-01T09:00:00Z'),
  (md5('cultivate-next:governance:representation')::uuid, 'broaden-citizen-representation', 'Broaden citizen representation', 'Invite recipient and volunteer representatives to the next quarterly coordination review.', 'Rotate participation and publish how community input changed operational decisions.', 'Medium', 'Participation', 'Half day', 'Governance leads', 'published', '2026-07-01T09:00:00Z')
on conflict (id) do nothing;

insert into public.engagement_resources (
  id, slug, title, summary, content, resource_type, audience, status, published_at
)
values
  (md5('cultivate-next:engagement:priorities')::uuid, 'neighbourhood-food-priorities-canvas', 'Neighbourhood food priorities canvas', 'A 60-minute facilitated session for mapping needs, assets and participation barriers.', 'Fictional demonstration workshop outline for local adaptation.', 'Workshop', 'Residents and coordinators', 'published', '2026-07-01T09:00:00Z'),
  (md5('cultivate-next:engagement:welcome')::uuid, 'inclusive-volunteer-welcome-pack', 'Inclusive volunteer welcome pack', 'Plain-language prompts covering access needs, expectations and ways to contribute.', 'Fictional template with prompts for an inclusive volunteer induction.', 'Template', 'Volunteer leads', 'published', '2026-07-01T09:00:00Z'),
  (md5('cultivate-next:engagement:feedback')::uuid, 'community-feedback-without-survey-fatigue', 'Community feedback without survey fatigue', 'Five practical formats for gathering useful feedback during existing activities.', 'Fictional guide for low-burden community feedback.', 'Guide', 'Engagement teams', 'published', '2026-07-01T09:00:00Z'),
  (md5('cultivate-next:engagement:practice')::uuid, 'shared-food-safety-briefing', 'Running a shared food-safety briefing', 'A fictional peer session from three demonstration initiatives.', '24 July, 14:00. Online demonstration session with 18 fictional places.', 'Practice exchange', 'Community of Practice', 'published', '2026-07-01T09:00:00Z')
on conflict (id) do nothing;

end
$seed$;
