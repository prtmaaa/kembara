# Kembara — Development Roadmap

## Bug Fix (blocking)

### Delete Trip RLS
**Root cause:** Missing `DELETE` policy on `trips` table — Supabase silently ignores the delete.
**Fix:** Apply to Supabase SQL Editor:
```sql
create policy "Trip owner can delete trip" on trips for delete
  using (created_by = auth.uid());
```
Schema file already updated (`supabase-schema.sql`).

---

## Feature Backlog (priority order)

### 1. Mark Debt as Settled
**Why first:** Settlement screen is read-only — users can see who owes what but can't record payment. Core utility missing.

**Scope:**
- `SettlementScreen.tsx` — add "Mark as Paid" button on each debt row
- Opens a confirmation sheet: "Confirm [Bob] paid [Alice] IDR 100,000?"
- On confirm: calls `useCreateSettlement()` (already exists in `useSettlements.ts`)
- After recording: debt disappears from list (re-run `calculateDebts` minus recorded settlements)
- `calculateDebts` in `src/utils/debtCalculator.ts` — needs to accept existing settlements to offset balances
- No new DB table needed — `settlements` table already exists

**What already exists:** `useSettlements`, `useCreateSettlement`, `Settlement` type, DB table + RLS policies

---

### 2. Invite Member Flow (complete it)
**Why second:** A trip with 1 member is useless for expense splitting.

**Scope:**
- `InviteMemberScreen.tsx` — invite link + QR already renders, but deep link handling is missing
- `JoinTripScreen.tsx` — already exists, needs to handle `kembara://join/:token` deep link on cold launch
- `app.json` — add URL scheme (`kembara://`) if not present
- Test: share link → recipient opens → lands on JoinTripScreen → joins trip

**What already exists:** `trip_invites` table, invite generation, `JoinTripScreen`, QR display

---

### 3. Expense Category Filter
**Why third:** Trips accumulate many expenses — filtering by category (food, transport, etc.) reduces scroll fatigue.

**Scope:**
- `ExpensesTabScreen.tsx` — add horizontal pill filter row (categories + "All")
- Filter applied client-side on `expenses` array (no new query needed)
- `ExpenseCategory` type already defined: `food | transport | accommodation | activity | shopping | other`
- `PillFilter` component already exists at `src/components/ui/PillFilter.tsx`

**What already exists:** `PillFilter`, `ExpenseCategory` type, category field on expenses

---

### 4. Itinerary Tab
**Why fourth:** Tab exists but shows placeholder — gives impression of an unfinished app.

**Scope:**
- New DB table: `itinerary_items (id, trip_id, date, time, title, notes, created_by)`
- `src/hooks/useItinerary.ts` — `useItineraryItems(tripId)`, `useCreateItineraryItem()`, `useDeleteItineraryItem()`
- `ItineraryScreen.tsx` — replace placeholder with day-grouped list + FAB to add item
- Simple form: date, time (optional), title, notes (optional)

**What already exists:** `ItineraryScreen.tsx` shell, tab navigation wired up

---

### 5. Export Polish
**Why last:** Nice-to-have, `ExportScreen` already renders a summary card.

**Scope:**
- `ExportScreen.tsx` — fix layout, make the share image actually look good
- Add expense breakdown by category in the exported card
- `react-native-view-shot` already installed for capture

**What already exists:** `ExportScreen`, `react-native-view-shot` dependency
