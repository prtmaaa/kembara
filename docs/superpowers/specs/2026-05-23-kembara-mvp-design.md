# Kembara — MVP Design Spec
Date: 2026-05-23

---

## 1. Product Vision

Kembara is a travel expense app for group travelers — anyone who travels together and needs to track, split, and settle shared expenses. It is not a generic expense splitter repurposed for travel; it is designed from the ground up for the travel context.

**Core value proposition:** You travel together, you track expenses together, you settle up fairly — without friction.

**Target market:** International group travelers (backpackers, friend groups, families) — not limited to Indonesia.

**Competitive positioning:** Splitwise and Tricount are the main competitors. Kembara wins by being travel-first (itinerary + expenses in one app), having better mobile UX, and handling multi-currency properly.

---

## 2. MVP Scope (v1 — Approach C)

### In v1

| # | Feature | Description |
|---|---------|-------------|
| 1 | Auth | Register, login, profile |
| 2 | Trip management | Create trip, invite via link/QR, granular member permissions |
| 3 | Expense tracking | Add/edit/delete expenses, additional charges, multi-currency + live rates |
| 4 | Dashboard | Total spending, per-category breakdown, per-member contribution, settlement summary |
| 5 | Settlement calculation | Smart debt simplification — who owes whom |
| 6 | Export summary | Shareable trip recap as image via native share sheet |

### Deferred to v1.1
- Offline mode (SQLite local DB + Supabase sync)
- Push notifications

### Deferred to v2+
- Receipt scanning / OCR (premium feature)
- Category-level budgets
- Packing checklist
- Trip templates
- Full Itinerary and Discover tabs (UI exists, not core business logic)

---

## 3. Monetization

**Model: Freemium**

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | Max 3 active trips, max 5 members per trip, exchange rates refreshed once per day |
| Premium | $2.99/month or $19.99/year | Unlimited trips, unlimited members, real-time exchange rates, image export, receipt scanning (v2+) |

---

## 4. Feature Specs

### 4.1 Auth
- Email + password via Supabase Auth
- Profile: full name, avatar displayed as colored initials (palette from DESIGN.md)
- No social login in v1

### 4.2 Trip Management

**Create/Edit Trip**
- Fields: name, destination, start date, end date, base currency, total budget (optional)
- Stored in `trips` table

**Invite via Link**
- Owner generates a shareable link: `kembara.app/join/[token]`
- Anyone with the link can request to join; owner approves
- Token stored in trips table or a separate `trip_invites` table

**Invite via QR**
- QR code generated from the same invite link
- Shown in-app for in-person sharing

**Member Permissions**

Philosophy: democratic by default — all members have equal access to expenses. The trip creator (owner) has additional control over the trip itself.

Default permissions for all members:

| Permission | Default Member | Owner |
|---|---|---|
| Add expense | ✅ | ✅ |
| Edit any expense | ✅ | ✅ |
| Delete any expense | ✅ | ✅ |
| Invite new members | ✅ | ✅ |
| Remove a member | ❌ | ✅ |
| Edit trip details | ❌ | ✅ |
| Delete trip | ❌ | ✅ |

Owner can toggle individual permissions per member (e.g., restrict a member from editing others' expenses). Stored as JSONB in `trip_members.permissions`.

**Member Management**
- Owner can remove members and customize their permissions
- Members can leave a trip
- Uses `trip_members` table

**v2+ Roadmap — Audit Log & Approval Flow**
- Activity log: record who added, edited, or deleted which expense and when
- Edit/delete request: if a member edits or deletes someone else's expense, a notification is sent to the expense owner who can approve or reject the change

### 4.3 Expense Tracking

**Add/Edit Expense**
- Fields: title, amount, currency, category, date, paid by (which member), split with (which members)
- Both add and edit use the same form — edit pre-fills all existing values
- Stored in `expenses` + `expense_participants` tables

**Additional Charges**
- Optional section in the expense form: service charge (%) and tax (%)
- Auto-calculates and adds to the subtotal in real time as user types
- Stored as `service_charge_pct` and `tax_pct` fields on the expense
- Breakdown shown in expense detail: subtotal + service charge + tax = total
- Example: meal Rp 200k + 10% service + 11% PPN = Rp 242k

**Split Modes**
- Equal split (default): total amount (including charges) divided evenly among selected participants
- Custom split: manual amount per participant
- Share amounts stored in `expense_participants.share_amount`

**Multi-currency + Live Exchange Rates**
- User selects currency when adding expense
- If currency differs from trip base currency, auto-fetch rate from Frankfurter API (free, no API key required)
- Rate stored in `expenses.exchange_rate`, converted amount in `expenses.amount_in_base`
- Free tier: rate fetched once per day and cached
- Premium tier: real-time rate on every add

**Categories**
- food, transport, accommodation, activity, shopping, other
- Icons and colors per DESIGN.md category icon system

**Permissions**
- Controlled by per-member permission flags (see Section 4.2)
- By default all members can edit/delete any expense
- Owner can restrict individual members via permission toggles

### 4.4 Dashboard

The Home tab shows a live summary of the active trip — the primary screen users open to understand the current state of group spending.

**Stats displayed:**
- Total spent so far (in base currency) vs total budget
- Budget progress bar with percentage used
- Remaining budget amount
- Days left in trip
- Number of travelers

**Per-category breakdown:**
- Amount spent per category (food, transport, accommodation, activity, shopping, other)
- Visual bar or pill per category showing proportion of total

**Per-member contribution:**
- How much each member has paid so far
- Net balance per member (positive = is owed money, negative = owes money)
- Avatar + name + amount in a list

**Settlement summary:**
- Quick view of unresolved settlements (e.g., "2 payments pending")
- Tap to go to full settlement screen

**Active trip context:**
- If user has multiple trips, dashboard reflects the most recently active trip
- Tap to switch trips

Data sourced from `expenses`, `expense_participants`, `trip_members`, and `trips` tables — no separate aggregation table needed for v1.

### 4.5 Settlement Calculation

**Algorithm: Debt Simplification**
1. Compute net balance for each member (total paid - total owed)
2. Separate into creditors (positive balance) and debtors (negative balance)
3. Use greedy algorithm to match largest debtor with largest creditor, minimizing number of transactions
4. Example: A→B 100k, B→C 100k → simplified to A→C 100k (B is net zero, no transaction needed)

**Display**
- List of transactions: "Alex needs to pay Rp 150,000 to Budi"
- "Mark as settled" button per transaction
- Settled transactions stored in `settlements` table, never deleted

### 4.6 Export Summary

**Format:** Image (PNG) — more universal than PDF for mobile, shareable on WhatsApp, Instagram Stories, etc.

**Content:**
- Trip name and destination
- Date range and total duration
- Total expenses (in base currency)
- Breakdown by category (amounts + percentages)
- Member list with net balance
- Settlement list (who pays whom)
- Kembara branding

**Implementation:** Generate using `react-native-view-shot` (captures a styled View as image)

**Share:** Native share sheet via `expo-sharing` or `Share` API

---

## 5. Development Sequence

Build order follows the dependency chain — each phase depends on the previous.

### Phase 1 — Foundation
- Audit existing `src/` — keep what's solid, rewrite what's not
- Establish data layer: React Query + Supabase client
- Centralize all design tokens in `src/theme.ts`
- Build shared component library (cards, pills, buttons, inputs) from DESIGN.md

### Phase 2 — Auth & Profile
- Login screen
- Register screen
- Profile screen (edit name, view avatar)

### Phase 3 — Trip Core
- Create & edit trip
- Trip detail screen
- Invite via link (generate token, deep link handling, join flow)
- Invite via QR code
- Member management (approve join request, remove member, leave trip)

### Phase 4 — Expenses & Dashboard
- Add & edit expense (all fields, additional charges, split modes)
- Live exchange rate integration (Frankfurter API)
- Expense list with category filter
- Delete expense
- Dashboard: total spending, per-category breakdown, per-member contribution, settlement summary

### Phase 5 — Settlement
- Debt simplification algorithm
- Settlement screen (who owes whom)
- Mark as settled

### Phase 6 — Export
- Trip summary image generation
- Native share sheet integration

**v1 launch-ready after Phase 6.**

---

## 6. Technical Notes

- **Stack**: Expo SDK 55, React Native, TypeScript, Supabase
- **Navigation**: React Navigation (already wired — bottom tabs + native stack)
- **Data fetching**: React Query (TanStack Query) — not yet installed, needs adding
- **Exchange rates**: Frankfurter API (`https://api.frankfurter.app/latest?from=USD`)
- **Image export**: `react-native-view-shot` — needs adding
- **QR code**: `react-native-qrcode-svg` — needs adding
- **Deep linking**: Expo Linking for invite link handling
- **Schema additions needed**: `expenses` table needs `service_charge_pct numeric default 0` and `tax_pct numeric default 0` columns; `trip_members` table needs `permissions jsonb` column

---

## 7. Out of Scope (Do Not Build)

- Flight/hotel booking integration
- Social feed or public trips
- Visa requirements or travel advisories
- Weather integration
- AI trip planner
- Corporate expense management
- Loyalty points tracking
- Web version (mobile-first for v1)
