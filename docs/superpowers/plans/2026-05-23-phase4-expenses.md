# Phase 4 — Expenses & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild AddExpense and EditExpense screens with additional charges + live exchange rates. Update ExpensesTabScreen with real budget data. Add per-category and per-member spending breakdowns to the dashboard.

**Architecture:** `useExchangeRate` hook auto-fetches rates from Frankfurter API when currency changes. Additional charges (service charge %, tax %) calculate total in real-time and are stored as separate columns. `useCreateExpense` and `useUpdateExpense` mutations handle participant splits.

**Prerequisite:** Phase 1 (hooks) and Phase 3 (trip screens with budget field) complete.

---

## File Map

**Modify:**
- `src/screens/expenses/AddExpenseScreen.tsx` — complete rewrite: charges, live rates, React Query
- `src/screens/expenses/EditExpenseScreen.tsx` — complete rewrite: pre-fill from expense, same form as Add
- `src/screens/expenses/ExpensesTabScreen.tsx` — use hooks, real budget donut ring
- `src/screens/trips/TripListScreen.tsx` — add per-category + per-member dashboard sections

---

## Task 1: Rewrite AddExpenseScreen

**Files:**
- Modify: `src/screens/expenses/AddExpenseScreen.tsx`

Key changes vs current version:
- Use `useCreateExpense` mutation
- Auto-fetch exchange rate via `useExchangeRate` when currency ≠ base currency
- Additional charges section (service charge %, tax %) with real-time total calculation
- Custom split mode (manual amount per participant, not just equal)
- All fields use `AppInput` / shared components

- [ ] **Step 1: Rewrite AddExpenseScreen**

```typescript
import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch,
} from 'react-native'
import { useMembers } from '../../hooks/useMembers'
import { useCreateExpense } from '../../hooks/useExpenses'
import { useExchangeRate, getRateToBase } from '../../hooks/useExchangeRate'
import { useTrip } from '../../hooks/useTrips'
import { useAuth } from '../../hooks/useAuth'
import { ExpenseCategory } from '../../types'
import { colors } from '../../theme'
import AppInput from '../../components/ui/AppInput'
import AppButton from '../../components/ui/AppButton'
import CategoryIcon from '../../components/ui/CategoryIcon'
import Icon from '../../components/Icon'

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD', 'GBP', 'THB']
const CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'accommodation', 'activity', 'shopping', 'other']
const CAT_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food', transport: 'Transport', accommodation: 'Stay',
  activity: 'Activity', shopping: 'Shopping', other: 'Other',
}

export default function AddExpenseScreen({ route, navigation }: any) {
  const { tripId } = route.params
  const { profile } = useAuth()
  const { data: trip } = useTrip(tripId)
  const { data: memberRows = [] } = useMembers(tripId)
  const createExpense = useCreateExpense()

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(trip?.base_currency ?? 'IDR')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState(profile?.id ?? '')
  const [participants, setParticipants] = useState<Record<string, boolean>>({})
  const [splitEvenly, setSplitEvenly] = useState(true)
  const [customShares, setCustomShares] = useState<Record<string, string>>({})
  const [serviceCharge, setServiceCharge] = useState('')
  const [taxPct, setTaxPct] = useState('')
  const [showCharges, setShowCharges] = useState(false)
  const [error, setError] = useState('')

  const baseCurrency = trip?.base_currency ?? 'IDR'
  const isForeignCurrency = currency !== baseCurrency
  const { data: ratesData } = useExchangeRate(baseCurrency, isForeignCurrency)

  const autoRate = isForeignCurrency
    ? getRateToBase(ratesData?.rates, currency, baseCurrency)
    : 1

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    const shares: Record<string, string> = {}
    memberRows.forEach(m => { initial[m.user_id] = true; shares[m.user_id] = '' })
    setParticipants(initial)
    setCustomShares(shares)
  }, [memberRows.length])

  useEffect(() => {
    setCurrency(trip?.base_currency ?? 'IDR')
  }, [trip?.base_currency])

  const subtotal = parseFloat(amount) || 0
  const svcPct = parseFloat(serviceCharge) || 0
  const taxPctNum = parseFloat(taxPct) || 0
  const totalAmount = subtotal * (1 + svcPct / 100 + taxPctNum / 100)
  const amountInBase = totalAmount * autoRate

  const selectedParticipantIds = Object.entries(participants)
    .filter(([, selected]) => selected)
    .map(([uid]) => uid)

  async function handleSubmit() {
    if (!title.trim() || !amount || !paidBy || selectedParticipantIds.length === 0) {
      setError('Title, amount, payer, and at least one participant are required.')
      return
    }
    setError('')
    try {
      await createExpense.mutateAsync({
        expense: {
          trip_id: tripId,
          paid_by: paidBy,
          title: title.trim(),
          amount: totalAmount,
          currency,
          amount_in_base: amountInBase,
          exchange_rate: autoRate,
          service_charge_pct: svcPct,
          tax_pct: taxPctNum,
          category,
          date,
        },
        participantIds: selectedParticipantIds,
        splitEvenly,
        customShares: splitEvenly ? undefined : Object.fromEntries(
          Object.entries(customShares).map(([k, v]) => [k, parseFloat(v) || 0])
        ),
      })
      navigation.goBack()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppInput label="Title" placeholder="e.g. Dinner at Jimbaran" value={title} onChangeText={setTitle} />

      <View style={styles.amountRow}>
        <View style={{ flex: 1 }}>
          <AppInput
            label="Amount"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.currencyCol}>
          <Text style={styles.fieldLabel}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {CURRENCIES.map(c => (
              <TouchableOpacity key={c} style={[styles.chip, currency === c && styles.chipActive]} onPress={() => setCurrency(c)}>
                <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {isForeignCurrency && (
        <View style={styles.rateInfo}>
          <Icon name="receipt" size={12} color={colors.ocean} />
          <Text style={styles.rateText}>
            1 {currency} = {autoRate.toFixed(4)} {baseCurrency}
            {ratesData ? ' (live)' : ' (estimated)'}
          </Text>
        </View>
      )}

      <Text style={styles.fieldLabel}>Category</Text>
      <View style={styles.catGrid}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)}>
            <CategoryIcon category={c} size={28} />
            <Text style={[styles.catLabel, category === c && styles.catLabelActive]}>{CAT_LABELS[c]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <AppInput label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />

      {/* Additional charges toggle */}
      <TouchableOpacity style={styles.chargesToggle} onPress={() => setShowCharges(!showCharges)}>
        <Icon name={showCharges ? 'chevronR' : 'plus'} size={14} color={colors.ocean} />
        <Text style={styles.chargesToggleText}>Additional charges (service charge, tax)</Text>
      </TouchableOpacity>

      {showCharges && (
        <View style={styles.chargesBox}>
          <AppInput
            label="Service Charge %"
            placeholder="e.g. 10"
            value={serviceCharge}
            onChangeText={setServiceCharge}
            keyboardType="decimal-pad"
          />
          <AppInput
            label="Tax %"
            placeholder="e.g. 11"
            value={taxPct}
            onChangeText={setTaxPct}
            keyboardType="decimal-pad"
          />
          {totalAmount !== subtotal && subtotal > 0 && (
            <View style={styles.totalBreakdown}>
              <Text style={styles.totalRow}>Subtotal: {subtotal.toLocaleString()} {currency}</Text>
              {svcPct > 0 && <Text style={styles.totalRow}>Service ({svcPct}%): {(subtotal * svcPct / 100).toLocaleString()} {currency}</Text>}
              {taxPctNum > 0 && <Text style={styles.totalRow}>Tax ({taxPctNum}%): {(subtotal * taxPctNum / 100).toLocaleString()} {currency}</Text>}
              <Text style={styles.totalFinal}>Total: {totalAmount.toLocaleString()} {currency}</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.fieldLabel}>Paid by</Text>
      {memberRows.map((m, i) => {
        const name = m.profile?.full_name ?? m.profile?.email ?? 'Unknown'
        return (
          <TouchableOpacity
            key={m.user_id}
            style={[styles.memberRow, paidBy === m.user_id && styles.memberRowActive]}
            onPress={() => setPaidBy(m.user_id)}
          >
            <Text style={[styles.memberName, paidBy === m.user_id && styles.memberNameActive]}>{name}</Text>
          </TouchableOpacity>
        )
      })}

      <View style={styles.splitHeader}>
        <Text style={styles.fieldLabel}>Split between</Text>
        <View style={styles.splitToggle}>
          <Text style={styles.splitLabel}>Equal split</Text>
          <Switch
            value={splitEvenly}
            onValueChange={setSplitEvenly}
            trackColor={{ true: colors.ocean, false: colors.sand }}
          />
        </View>
      </View>

      {memberRows.map((m) => {
        const name = m.profile?.full_name ?? m.profile?.email ?? 'Unknown'
        return (
          <View key={m.user_id} style={styles.participantRow}>
            <Switch
              value={participants[m.user_id] ?? false}
              onValueChange={() => setParticipants(prev => ({ ...prev, [m.user_id]: !prev[m.user_id] }))}
              trackColor={{ true: colors.ocean }}
            />
            <Text style={styles.memberName}>{name}</Text>
            {!splitEvenly && participants[m.user_id] && (
              <AppInput
                placeholder="Amount"
                value={customShares[m.user_id] ?? ''}
                onChangeText={v => setCustomShares(prev => ({ ...prev, [m.user_id]: v }))}
                keyboardType="decimal-pad"
                style={{ width: 100 }}
              />
            )}
          </View>
        )
      })}

      {splitEvenly && selectedParticipantIds.length > 0 && amountInBase > 0 && (
        <Text style={styles.splitPreview}>
          Each pays: {(amountInBase / selectedParticipantIds.length).toLocaleString()} {baseCurrency}
        </Text>
      )}

      <AppButton label="Add Expense" onPress={handleSubmit} loading={createExpense.isPending} style={styles.btn} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  error: { fontFamily: 'DMSans_400Regular', color: colors.sunset, fontSize: 13 },
  fieldLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  amountRow: { flexDirection: 'row', gap: 12 },
  currencyCol: { flex: 1, gap: 6 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 100, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.night, borderColor: colors.night },
  chipText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.text },
  chipTextActive: { color: colors.white },
  rateInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.oceanSoft, borderRadius: 10, padding: 10 },
  rateText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.ocean },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { alignItems: 'center', gap: 4, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, minWidth: 72 },
  catChipActive: { borderColor: colors.ocean, backgroundColor: colors.oceanSoft },
  catLabel: { fontFamily: 'DMSans_500Medium', fontSize: 10, color: colors.muted },
  catLabelActive: { color: colors.ocean },
  chargesToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chargesToggleText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.ocean },
  chargesBox: { backgroundColor: colors.white, borderRadius: 16, padding: 14, gap: 12 },
  totalBreakdown: { gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  totalFinal: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.text },
  memberRow: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.white },
  memberRowActive: { borderColor: colors.ocean, backgroundColor: colors.oceanSoft },
  memberName: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text },
  memberNameActive: { color: colors.ocean },
  splitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  splitToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  splitLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  splitPreview: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, textAlign: 'center' },
  btn: { marginTop: 8 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/expenses/AddExpenseScreen.tsx
git commit -m "feat: rewrite AddExpenseScreen with charges, live rates, React Query"
```

---

## Task 2: Rewrite EditExpenseScreen

**Files:**
- Modify: `src/screens/expenses/EditExpenseScreen.tsx`

Same form as AddExpense but pre-filled with existing expense data. Uses `useUpdateExpense` mutation.

- [ ] **Step 1: Check existing EditExpenseScreen**

Read `src/screens/expenses/EditExpenseScreen.tsx` to assess current state before rewriting.

- [ ] **Step 2: Rewrite EditExpenseScreen**

The structure is identical to AddExpenseScreen with these differences:
1. Load existing expense via:
```typescript
const { data: expense } = useQuery({
  queryKey: ['expense', expenseId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, participants:expense_participants(*)')
      .eq('id', expenseId)
      .single()
    if (error) throw error
    return data as Expense
  },
})
```

2. Populate state from expense in `useEffect`:
```typescript
useEffect(() => {
  if (expense) {
    setTitle(expense.title)
    setAmount(String(expense.amount))
    setCurrency(expense.currency)
    setCategory(expense.category)
    setDate(expense.date)
    setPaidBy(expense.paid_by)
    setServiceCharge(expense.service_charge_pct > 0 ? String(expense.service_charge_pct) : '')
    setTaxPct(expense.tax_pct > 0 ? String(expense.tax_pct) : '')
    if (expense.service_charge_pct > 0 || expense.tax_pct > 0) setShowCharges(true)
    const parts: Record<string, boolean> = {}
    expense.participants?.forEach(p => { parts[p.user_id] = true })
    setParticipants(parts)
  }
}, [expense])
```

3. Submit calls `useUpdateExpense` instead of `useCreateExpense`:
```typescript
const updateExpense = useUpdateExpense()

await updateExpense.mutateAsync({
  expenseId,
  tripId,
  updates: { title, amount: totalAmount, currency, amount_in_base: amountInBase, exchange_rate: autoRate, service_charge_pct: svcPct, tax_pct: taxPctNum, category, date, paid_by: paidBy },
  participantIds: selectedParticipantIds,
  splitEvenly,
  customShares: splitEvenly ? undefined : ...,
})
```

4. Add delete button at bottom:
```typescript
const deleteExpense = useDeleteExpense()

<AppButton
  label="Delete Expense"
  variant="danger"
  onPress={() => Alert.alert('Delete', 'Delete this expense?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await deleteExpense.mutateAsync({ expenseId, tripId })
      navigation.goBack()
    }},
  ])}
  style={{ marginTop: 8 }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/expenses/EditExpenseScreen.tsx
git commit -m "feat: rewrite EditExpenseScreen with pre-fill, charges, live rates, delete"
```

---

## Task 3: Update ExpensesTabScreen

**Files:**
- Modify: `src/screens/expenses/ExpensesTabScreen.tsx`

Key changes:
- Use `useExpenses` + `useTrip` hooks instead of direct Supabase calls
- Fix donut ring to use real budget data (`trip.budget`)
- Add "shopping" and "other" to category filter
- Show `remaining` amount when budget is set

- [ ] **Step 1: Replace data fetching with hooks**

Replace the `useState`/`useFocusEffect`/`fetchData` block with:

```typescript
import { useExpenses } from '../../hooks/useExpenses'
import { useTrip } from '../../hooks/useTrips'

// Inside component:
const { activeTripId } = useActiveTrip()
const paramTripId = route?.params?.tripId
const tripId = paramTripId ?? activeTripId

const { data: trip, isLoading: tripLoading } = useTrip(tripId ?? '')
const { data: expenses = [], isLoading: expLoading } = useExpenses(tripId ?? '')
const isLoading = tripLoading || expLoading
```

- [ ] **Step 2: Fix donut ring calculation**

Replace the hardcoded `pct` with real budget data:

```typescript
const total = expenses.reduce((s, e) => s + e.amount_in_base, 0)
const budget = trip?.budget ?? null
const pct = budget && total > 0 ? Math.min((total / budget) * 100, 100) : (expenses.length > 0 ? 65 : 0)
const remaining = budget ? Math.max(budget - total, 0) : null
```

Update the ring info section:
```typescript
<View style={styles.ringInfo}>
  <Text style={styles.ringTotal}>{total.toLocaleString()}</Text>
  <Text style={styles.ringSubText}>{trip.base_currency} total spent</Text>
  {remaining !== null ? (
    <Text style={styles.ringRemaining}>↑ {remaining.toLocaleString()} remaining</Text>
  ) : (
    <Text style={styles.ringRemaining}>↑ {expenses.length} transactions</Text>
  )}
</View>
```

- [ ] **Step 3: Add shopping + other to filter**

```typescript
type CatFilter = 'all' | 'accommodation' | 'food' | 'transport' | 'activity' | 'shopping' | 'other'

const CAT_LABELS: Record<CatFilter, string> = {
  all: 'All', accommodation: 'Stay', food: 'Food',
  transport: 'Transport', activity: 'Activity', shopping: 'Shopping', other: 'Other',
}

const cats: CatFilter[] = ['all', 'accommodation', 'food', 'transport', 'activity', 'shopping', 'other']
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/expenses/ExpensesTabScreen.tsx
git commit -m "feat: update ExpensesTabScreen with React Query, real budget ring, all categories"
```

---

## Task 4: Add Dashboard Breakdowns to TripListScreen

**Files:**
- Modify: `src/screens/trips/TripListScreen.tsx`

Add two sections below the Budget Overview card on the Home tab:
1. **Per-category spending** (for the active/hero trip)
2. **Per-member contribution** (who paid how much)

These sections only show when the hero trip has expenses.

- [ ] **Step 1: Add per-category and per-member queries**

Inside `TripListScreen`, after the existing `totalSpent` query, add:

```typescript
const { data: heroExpenses = [] } = useQuery({
  queryKey: ['expenses', heroTrip?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, paid_by_profile:profiles!paid_by(*), participants:expense_participants(*, profile:profiles(*))')
      .eq('trip_id', heroTrip!.id)
    if (error) throw error
    return data
  },
  enabled: !!heroTrip?.id,
})
```

- [ ] **Step 2: Compute category breakdown**

```typescript
const categoryBreakdown = React.useMemo(() => {
  const map: Record<string, number> = {}
  heroExpenses.forEach((e: any) => {
    map[e.category] = (map[e.category] ?? 0) + e.amount_in_base
  })
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4) // show top 4 categories
}, [heroExpenses])

const memberContributions = React.useMemo(() => {
  const map: Record<string, { name: string; paid: number }> = {}
  heroExpenses.forEach((e: any) => {
    const id = e.paid_by
    const name = e.paid_by_profile?.full_name?.split(' ')[0] ?? e.paid_by_profile?.email ?? 'Unknown'
    map[id] = { name, paid: (map[id]?.paid ?? 0) + e.amount_in_base }
  })
  return Object.values(map).sort((a, b) => b.paid - a.paid)
}, [heroExpenses])
```

- [ ] **Step 3: Add category breakdown section to JSX**

Add after Budget Overview card (before Upcoming Trips):

```typescript
{heroTrip && categoryBreakdown.length > 0 && (
  <View>
    <SectionHeader title="By Category" />
    <View style={styles.catBreakdownCard}>
      {categoryBreakdown.map(([cat, amount]) => {
        const pct = total > 0 ? amount / total : 0
        const { bg, icon: iconColor } = categoryColor[cat] ?? categoryColor.other
        return (
          <View key={cat} style={styles.catBreakdownRow}>
            <CategoryIcon category={cat as any} size={32} />
            <View style={styles.catBreakdownInfo}>
              <View style={styles.catBreakdownTop}>
                <Text style={styles.catBreakdownName}>{CAT_LABELS_SHORT[cat] ?? cat}</Text>
                <Text style={styles.catBreakdownAmt}>{formatShort(amount)}</Text>
              </View>
              <View style={styles.catBarTrack}>
                <View style={[styles.catBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: iconColor }]} />
              </View>
            </View>
          </View>
        )
      })}
    </View>
  </View>
)}

{heroTrip && memberContributions.length > 1 && (
  <View>
    <SectionHeader title="By Member" />
    <View style={styles.memberContribCard}>
      {memberContributions.map((m, i) => (
        <View key={i} style={styles.memberContribRow}>
          <AvatarInitials name={m.name} index={i} size={32} />
          <Text style={styles.memberContribName}>{m.name}</Text>
          <Text style={styles.memberContribAmt}>{formatShort(m.paid)} {heroTrip.base_currency}</Text>
        </View>
      ))}
    </View>
  </View>
)}
```

Add to imports: `import { categoryColor } from '../../theme'` and `import CategoryIcon from '../../components/ui/CategoryIcon'` and `import AvatarInitials from '../../components/ui/AvatarInitials'`

Add helpers:
```typescript
const CAT_LABELS_SHORT: Record<string, string> = {
  food: 'Food', transport: 'Transport', accommodation: 'Stay',
  activity: 'Activity', shopping: 'Shopping', other: 'Other',
}
```

Add to styles:
```typescript
catBreakdownCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
catBreakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
catBreakdownInfo: { flex: 1, gap: 6 },
catBreakdownTop: { flexDirection: 'row', justifyContent: 'space-between' },
catBreakdownName: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
catBreakdownAmt: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.text },
catBarTrack: { height: 4, backgroundColor: colors.sand, borderRadius: 100 },
catBarFill: { height: '100%', borderRadius: 100 },
memberContribCard: { backgroundColor: colors.white, borderRadius: 16, padding: 14, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
memberContribRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
memberContribName: { flex: 1, fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
memberContribAmt: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.text },
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/trips/TripListScreen.tsx
git commit -m "feat: add per-category and per-member dashboard breakdowns"
```

---

## Phase 4 Complete ✓

**Test manually:**
- Add expense in foreign currency → live rate auto-fills, shows "live" indicator
- Add expense with service charge + tax → breakdown shows, total is correct
- Edit expense → all fields pre-filled, can change and save
- Delete expense from edit screen → expense removed, list refreshes
- Expenses tab → donut ring shows real budget % when budget is set
- Home tab → category breakdown + member contribution shows for active trip

**Next:** `2026-05-23-phase5-settlement.md`
