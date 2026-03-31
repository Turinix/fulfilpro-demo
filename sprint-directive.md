# Sprint Directive: FulfilPro POC — Overnight Build

**Priority:** URGENT — Demo must be ready by tomorrow morning
**Project:** FulfilPro POC (a1b2c3d4-e5f6-7890-abcd-ef1234567890)
**Repo:** ~/Turinix/upwork/clients/inventory-mgmt/
**Goal:** Working POC of a fulfilment management system for a D2C apparel brand doing 500+ orders/day. Screen-share demo for client call.

---

## Context

A potential Upwork client runs a D2C apparel brand currently managing everything through Google Sheets. They want a custom fulfilment system covering: order routing, production queues, picking, packing, dispatch, inventory management, returns, and AI-powered demand forecasting. We are building a demo-quality POC with realistic fake data to walk them through the entire order lifecycle.

**This is NOT a production build.** It's a working demo with:
- Realistic seeded data (50 SKUs, 200+ orders, 30 days of forecast)
- Simulated integrations (button press instead of Shopify webhook)
- Local Docker deployment (no cloud hosting needed)
- Single user, no auth

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) — full-stack (pages + API routes) |
| ORM | Prisma |
| Database | PostgreSQL 16 (Docker) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Container | Docker Compose (postgres + app) |

---

## Data Model

### Core Tables

```prisma
model SKU {
  id          String   @id @default(uuid())
  name        String   // "Classic Crew Neck Tee"
  skuCode     String   @unique // "SKU-CN-BLK-L"
  category    String   // "Tops", "Bottoms", "Outerwear", "Accessories"
  size        String   // "S", "M", "L", "XL", "32", "34"
  color       String   // "Black", "Navy", "Grey"
  imageUrl    String?  // placeholder image URL
  price       Decimal  // retail price
  cost        Decimal  // manufacturing cost
  createdAt   DateTime @default(now())
  
  inventory      Inventory?
  orderItems     OrderItem[]
  forecasts      DemandForecast[]
}

model Inventory {
  id           String @id @default(uuid())
  skuId        String @unique
  sku          SKU    @relation(fields: [skuId], references: [id])
  inStock      Int
  reserved     Int    @default(0)
  reorderPoint Int
  aisle        String // "A", "B", "C"
  shelf        Int    // 1-5
  bin          Int    // 1-20
  
  @@index([inStock])
}

model Order {
  id              String   @id @default(uuid())
  orderNumber     String   @unique // "ORD-4521"
  channel         String   // "shopify", "amazon", "website", "instagram"
  customerName    String
  customerAddress String
  customerPhone   String
  status          String   @default("new") // new, routed, picking, packing, dispatched, shipped, return_requested
  routingDecision String?  // "stock", "production", null
  totalAmount     Decimal
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  items          OrderItem[]
  pickList       PickList?
  shipment       Shipment?
  productionJob  ProductionJob?
  returns        Return[]
}

model OrderItem {
  id        String @id @default(uuid())
  orderId   String
  order     Order  @relation(fields: [orderId], references: [id])
  skuId     String
  sku       SKU    @relation(fields: [skuId], references: [id])
  quantity  Int
  unitPrice Decimal
  
  pickListItems PickListItem[]
}

model PickList {
  id        String   @id @default(uuid())
  orderId   String   @unique
  order     Order    @relation(fields: [orderId], references: [id])
  status    String   @default("pending") // pending, in_progress, completed
  createdAt DateTime @default(now())
  
  items PickListItem[]
}

model PickListItem {
  id           String    @id @default(uuid())
  pickListId   String
  pickList     PickList  @relation(fields: [pickListId], references: [id])
  orderItemId  String
  orderItem    OrderItem @relation(fields: [orderItemId], references: [id])
  location     String    // "Aisle B, Shelf 3, Bin 12"
  picked       Boolean   @default(false)
  pickedAt     DateTime?
}

model ProductionJob {
  id          String    @id @default(uuid())
  orderId     String    @unique
  order       Order     @relation(fields: [orderId], references: [id])
  status      String    @default("queued") // queued, in_production, ready
  priority    String    @default("normal") // low, normal, high, urgent
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
}

model Shipment {
  id          String   @id @default(uuid())
  orderId     String   @unique
  order       Order    @relation(fields: [orderId], references: [id])
  courier     String   // "Delhivery", "Shiprocket", "BlueDart"
  awbNumber   String   // "AWB-892374612"
  packageSize String   // "small", "medium", "large"
  weight      Decimal? // kg
  status      String   @default("packed") // packed, dispatched, in_transit, delivered
  labelUrl    String?
  createdAt   DateTime @default(now())
}

model Return {
  id            String    @id @default(uuid())
  orderId       String
  order         Order     @relation(fields: [orderId], references: [id])
  rmaNumber     String    @unique // "RMA-1234"
  customerName  String
  reason        String    // "Wrong size", "Defective", "Changed mind", "Not as described"
  itemCondition String?   // "good", "damaged", "defective"
  status        String    @default("requested") // requested, approved, received, refunded, rejected
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model DemandForecast {
  id             String   @id @default(uuid())
  skuId          String
  sku            SKU      @relation(fields: [skuId], references: [id])
  date           DateTime
  predictedUnits Int
  actualUnits    Int?
  confidence     String   // "high", "medium", "low"
  
  @@unique([skuId, date])
}
```

---

## Order Status Flow

```
NEW → ROUTED ──→ [stock path] ────→ PICKING → PACKING → DISPATCHED → SHIPPED
              └→ [production path] → QUEUED → IN_PRODUCTION → READY ──↗
                                                                       
SHIPPED → RETURN_REQUESTED → RETURN_APPROVED → RETURN_RECEIVED → REFUNDED
```

---

## Phases (execute sequentially, each phase must be working before next)

### Phase 1: Foundation
**Files:** docker-compose.yml, Dockerfile, package.json, prisma/schema.prisma, prisma/seed.ts, src/lib/prisma.ts, tailwind.config.ts, next.config.js
**Acceptance:**
- `docker compose up db` starts PostgreSQL on port 5432
- `npx prisma migrate dev` creates all tables
- `npx prisma db seed` populates: 50 SKUs (apparel: tees, chinos, hoodies, jackets, accessories), inventory for each, 200 orders across 30 days (60% shopify, 20% amazon, 15% website, 5% instagram), order items, 30 days of demand forecast data, 5 production jobs, 10 shipments, 5 returns
- `npm run dev` starts Next.js on port 3000
- SKU names must be realistic apparel: "Classic Crew Neck Tee - Black - L", "Slim Fit Chinos - Navy - 32", "Organic Cotton Hoodie - Heather Grey - M"
- Orders have realistic Indian customer names and addresses
- 5-8 SKUs have inStock below reorderPoint (triggers alerts)
- 3 SKUs have clear upward demand trend in forecast data (for intelligence page)
- 3 SKUs have declining demand trend

### Phase 2: Layout Shell + Dashboard
**Files:** src/app/layout.tsx, src/components/Sidebar.tsx, src/components/TopBar.tsx, src/app/page.tsx, src/app/api/dashboard/*, src/components/dashboard/*
**Acceptance:**
- Sidebar nav with icons: Dashboard, Orders, Production, Inventory, Warehouse, Returns, Intelligence, Settings
- Active route highlighted
- Sidebar collapses on mobile to hamburger
- Dashboard page shows:
  - 4 KPI cards (Orders Today, Pending Fulfilment, In Production, Shipped Today) — queried from DB
  - Live Order Feed (10 most recent) with channel icon, customer, item count, status chip
  - Inventory Alerts panel — SKUs below reorder point
  - Orders by Channel bar chart (Recharts)
  - **"Simulate New Order" button** — creates a realistic random order via POST, page refreshes to show it

### Phase 3: Orders + Routing + Production
**Files:** src/app/orders/*, src/app/orders/[id]/*, src/app/production/*, src/app/api/orders/*, src/app/api/production/*
**Acceptance:**
- `/orders` — paginated table of all orders (order#, channel, customer, items, total, status chip, date). Sortable. Filter by status.
- `/orders/[id]` — full order detail:
  - Customer info card
  - Items table (thumbnail placeholder, SKU, name, size, color, qty, price)
  - **Routing Decision card**: checks all items against inventory. All in stock → green "FULFILL FROM STOCK". Any out → orange "SEND TO PRODUCTION" with items listed.
  - Approve Route button: if stock → creates PickList + PickListItems, decrements inventory.reserved, status → "picking". If production → creates ProductionJob, status → "routed".
  - Status timeline (vertical): received ✓ → routed → picking → packing → dispatched → shipped
- `/production` — production queue table:
  - Columns: order#, items to produce (SKU + qty), priority chip, status chip, created date
  - "Start Production" button → status = in_production
  - "Mark Ready" button → status = ready, order status → "picking", creates PickList, restocks inventory
  - Filter by status: queued / in_production / ready

### Phase 4: Inventory Management
**Files:** src/app/inventory/*, src/app/api/inventory/*
**Acceptance:**
- `/inventory` — full inventory table:
  - Columns: thumbnail, SKU code, product name, size, color, in stock (red if below reorder), reserved, available (computed: in_stock - reserved), reorder point, location, status chip (In Stock / Low / Out of Stock)
  - Search bar (by name or SKU code)
  - Filter dropdowns: category, size, color, stock level
  - Yellow banner at top: "X SKUs below reorder point"
  - "Adjust Stock" button per row → modal with +/- quantity input
  - "Add SKU" button → modal form (stretch goal, skip if short on time)
  - Pagination

### Phase 5: Warehouse Flow (Pick → Pack → Dispatch)
**Files:** src/app/warehouse/*, src/app/api/warehouse/*
**Acceptance:**
- `/warehouse` — warehouse hub with 3 tabs/sections:
  - **Pick Queue:** Orders in "picking" status. Click → go to pick list.
  - **Pack Queue:** Orders in "packing" status (picking completed). Click → go to pack screen.
  - **Dispatch Queue:** Orders packed and ready. Click → dispatch.
- `/warehouse/pick/[orderId]` — mobile-optimized pick list:
  - Dark background, large text, big touch targets
  - Progress bar: "X of Y items picked"
  - Item cards: product name, SKU, qty, **location in bold** (Aisle B, Shelf 3, Bin 12)
  - Large green "PICKED" button per item
  - Picked items: green checkmark, grayed out, moved to bottom
  - Bottom sticky: "SCAN BARCODE" button (shows alert "Scanner connected" — simulated), "COMPLETE PICK" (enabled when all picked → order status → "packing")
- `/warehouse/pack/[orderId]` — pack confirmation:
  - List of picked items (verification)
  - Package size selector: Small / Medium / Large
  - Weight input (optional)
  - "Generate Label" button → creates Shipment record with random AWB, shows mock label with barcode
  - "Confirm Packed" → order status → "dispatched"
- `/warehouse/dispatch` — dispatch queue:
  - Table: order#, courier, AWB, package size, packed at
  - "Print Label" button (shows label in modal)
  - "Mark Dispatched" → order status → "shipped"
  - "Dispatch All" bulk button

### Phase 6: Returns
**Files:** src/app/returns/*, src/app/api/returns/*
**Acceptance:**
- `/returns` — returns table:
  - Columns: RMA#, order#, customer, reason, status chip, date
  - "Simulate Return" button (creates a return for a random shipped order)
- `/returns/[id]` — return detail:
  - Original order info
  - Return reason
  - Item condition dropdown (Good / Damaged / Defective) — visible after "Receive"
  - Action flow: Approve → Receive & Inspect (set condition) → Process Refund
  - If condition = "good" → auto-restock to inventory
  - Status timeline: Requested → Approved → Received → Refunded

### Phase 7: Demand Intelligence
**Files:** src/app/intelligence/*, src/app/api/intelligence/*
**Acceptance:**
- `/intelligence` — demand forecasting dashboard:
  - Date range selector: 30 / 60 / 90 days
  - 3 insight cards:
    - Trending Up (green): top 3 SKUs with demand increase %, "Pre-produce" button
    - Seasonal Alert (orange): hardcoded "Summer collection spike in 2 weeks"
    - Slow Movers (gray): 3 SKUs with declining sales, "Consider markdown"
  - Demand Forecast line chart (Recharts): actual vs predicted, confidence band
  - Recommended Actions table: SKU, product, current stock, predicted demand 7d, recommended action, confidence chip, "Execute" button

### Phase 8: Integration Points + Docker + Polish
**Files:** src/app/settings/*, Dockerfile updates
**Acceptance:**
- `/settings/integrations` — integration architecture:
  - Visual cards for: Shopify (ready to connect), Amazon (Phase 2), Courier API (Phase 2), Demand Model (connected — simulated)
  - Each card: logo, status badge, "Configure" button (disabled for Phase 2 items)
- Dockerfile: multi-stage build for Next.js
- `docker compose up` starts both services, runs migrations, seeds data, app accessible on :3000
- All pages load without errors
- Status chips use consistent colors across all pages
- Mobile responsive: sidebar collapses, warehouse pages work on phone width

---

## Design Tokens (use across all pages)

```
Status chips:
  new        → bg-blue-100 text-blue-800
  routed     → bg-purple-100 text-purple-800
  picking    → bg-yellow-100 text-yellow-800
  packing    → bg-orange-100 text-orange-800
  dispatched → bg-indigo-100 text-indigo-800
  shipped    → bg-green-100 text-green-800
  return_*   → bg-red-100 text-red-800
  
Channel icons:
  shopify    → green shopping bag icon
  amazon     → orange box icon
  website    → blue globe icon
  instagram  → pink camera icon

Colors:
  primary    → blue-600 (#2563EB)
  success    → green-500
  warning    → yellow-500
  danger     → red-500
  surface    → gray-50 background, white cards
```

---

## Rules for Agents

1. **Do NOT add auth.** Single user, no login.
2. **Do NOT add real integrations.** All external calls are simulated with buttons.
3. **Realistic data matters more than features.** If short on time, make existing pages look great with real data rather than adding more pages.
4. **Mobile-first for warehouse pages only.** Dashboard and admin pages are desktop-first.
5. **Every page must work with seeded data on first load.** No empty states for the demo.
6. **Status chips must be consistent** — same color mapping everywhere.
7. **Keep API routes simple** — no pagination middleware, no complex validation. Direct Prisma queries.
8. **Tailwind only** — no component libraries (shadcn, MUI). Keep it lean.
9. **All "simulate" buttons must create realistic data** — proper names, addresses, quantities.

---

## Lessons from Prior Builds (MANDATORY — read before starting)

These are hard-won lessons from building Discipline RPG with this team. Ignoring them will cause failures.

### For CTO: Task Breakdown Rules
- **Every subtask must reference the exact Prisma model, API route path, and page path.** Vague tasks like "build the orders page" fail. Specific tasks like "Create GET /api/orders route returning Order with OrderItems and SKU joined, paginated, filterable by status" succeed.
- **Include acceptance criteria on every subtask.** "What does 'done' look like?" must be answerable by reading the ticket.
- **Split large tasks.** If a task touches >3 files or has >2 responsibilities, split it. Phase 3 (Orders + Routing + Production) MUST be split into at least 4-5 subtasks.
- **Specify the status chip color map in every frontend task.** Agents will invent their own colors otherwise, and they won't match.

### For Engineers: Code Quality
- **Check that components you create are actually USED in a page.** We've had agents create beautiful components that were never imported. Every component must be imported and rendered somewhere.
- **API route paths must match exactly what the frontend calls.** Verify: if the frontend fetches `/api/orders`, the route file must be at `src/app/api/orders/route.ts`. Not `/api/order/` (singular). Not `src/pages/api/` (wrong router).
- **Prisma relations: always use `include` for joins, never fetch IDs then query separately.** The seeded data has relations — use them. Example: `prisma.order.findMany({ include: { items: { include: { sku: true } } } })`.
- **Do NOT create separate utility/helper files for one-time operations.** If a function is used once, inline it. No premature abstractions.
- **Status transitions must be validated.** An order in "new" cannot jump to "packing". Check current status before advancing. The status flow diagram is the source of truth.
- **Every API route must return proper JSON.** No raw strings, no HTML. Always `NextResponse.json({ data })` or `NextResponse.json({ error }, { status: 4xx })`.

### For Frontend Engineers: UI Rules
- **Status chip colors are defined in the Design Tokens section. Do NOT invent new colors.** Copy the exact Tailwind classes specified. Every page must use the same StatusChip component.
- **Create a single `StatusChip` component in Phase 2 and reuse it everywhere.** Do not create per-page status badges.
- **Create a single `ChannelIcon` component and reuse it everywhere.** Same principle.
- **Tables must show real data on first render.** No loading spinners for 3 seconds on a demo. Use server components where possible for instant render.
- **The warehouse pick list page MUST be dark mode and mobile-optimized.** Use `dark` class on the page wrapper, large touch targets (min 48px), large font (min 16px body text). Test at 390px width.
- **Charts (Recharts) must have visible data from seeded records.** If the chart is empty because the query is wrong, the demo is dead. Test the API route returns data before wiring the chart.

### For QA: Verification
- **After each phase, verify ALL pages from phase 1 still work.** Regression is real — Phase 3 code can break Phase 2's dashboard if they share the same Prisma models.
- **Test the full status transition flow end-to-end:** Simulate order → Open order → Approve route → Pick items → Pack → Dispatch. If any step breaks, the demo fails.
- **Test on mobile viewport for warehouse pages.** Open Chrome DevTools → toggle device toolbar → iPhone 14 Pro.
- **Only QA moves tickets to done.** Engineers move to in_review.

### For All Agents: Speed Rules (CRITICAL)
- **This is a POC, not production.** Do NOT add error boundaries, loading skeletons, empty state illustrations, or analytics. Do NOT write tests. Do NOT add ESLint/Prettier config. Do NOT add a README.
- **No over-engineering.** No custom hooks for simple state. No context providers for data that's fetched once. No middleware. No rate limiting. No input sanitization beyond basic types.
- **If something works but looks slightly ugly, MOVE ON.** Polish is Phase 8. Ship functionality first.
- **Use server components by default.** Only add 'use client' when you need interactivity (buttons, forms, state). This is faster to build and renders instantly.
- **Seed data is your friend.** Don't spend time on empty states or "no data" views. The demo will always have data.

### Common Failure Modes to Avoid
1. **Agent creates API route at wrong path** → Frontend gets 404 → Page shows nothing. ALWAYS verify route file path matches the fetch URL.
2. **Prisma schema mismatch after edit** → Migration fails → Everything breaks. Run `npx prisma migrate dev` after ANY schema change and verify it succeeds.
3. **Agent modifies seed script and breaks it** → No demo data → Demo is useless. Seed script must be tested after any change: `npx prisma db seed` must complete without errors.
4. **Two agents edit the same file** → Merge conflict → Lost work. CTO must ensure no two subtasks touch the same file. If unavoidable, make them sequential, not parallel.
5. **Frontend fetches data client-side when it could be server-side** → Unnecessary loading delay → Bad demo impression. Default to server components with direct Prisma calls for read-only pages.
