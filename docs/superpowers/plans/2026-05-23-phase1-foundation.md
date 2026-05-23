# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the technical foundation for Kembara — schema migrations, updated types, installed dependencies, shared UI components, and React Query data hooks — so all feature phases can build on a consistent base.

**Architecture:** Supabase Postgres with new columns and a `trip_invites` table. TypeScript types reflect the full data model. TanStack React Query v5 wraps all Supabase calls via dedicated hooks. Shared UI components are derived directly from DESIGN.md tokens and used by every screen.

**Tech Stack:** Expo SDK 55, TypeScript, Supabase, TanStack React Query v5, react-native-qrcode-svg, react-native-view-shot

---

## File Map

**Modify:**
- `supabase-schema.sql` — add migration section for new columns + trip_invites table
- `src/types/index.ts` — add TripPermissions, TripInvite; update Trip, Expense, TripMember
- `package.json` — add new dependencies

**Create:**
- `src/components/ui/AppButton.tsx`
- `src/components/ui/AppInput.tsx`
- `src/components/ui/AvatarInitials.tsx`
- `src/components/ui/StatCard.tsx`
- `src/components/ui/SectionHeader.tsx`
- `src/components/ui/PillFilter.tsx`
- `src/components/ui/CategoryIcon.tsx`
- `src/hooks/useTrips.ts`
- `src/hooks/useTrip.ts`
- `src/hooks/useExpenses.ts`
- `src/hooks/useMembers.ts`
- `src/hooks/useExchangeRate.ts`
- `src/hooks/useSettlements.ts`
- `src/providers/QueryProvider.tsx`

---

## Task 1: Database Migration

**Files:**
- Modify: `supabase-schema.sql`

- [ ] **Step 1: Append migration SQL to supabase-schema.sql**

Add this block at the bottom of the file:

```sql
-- ============================================================
-- MIGRATION — MVP additions
-- Run in Supabase SQL Editor after initial schema
-- ============================================================

-- Add budget to trips
alter table trips add column if not exists budget numeric;

-- Add service charge and tax to expenses
alter table expenses add column if not exists service_charge_pct numeric not null default 0;
alter table expenses add column if not exists tax_pct numeric not null default 0;

-- Add granular permissions to trip_members
alter table trip_members add column if not exists permissions jsonb not null default '{
  "add_expense": true,
  "edit_expense": true,
  "delete_expense": true,
  "invite_member": true
}'::jsonb;

-- Trip invite tokens
create table if not exists trip_invites (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  token text not null unique,
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- RLS for trip_invites
alter table trip_invites enable row level security;

create policy "Trip members can view invites" on trip_invites for select
  using (trip_id in (select get_my_trip_ids()));

create policy "Trip members can create invites" on trip_invites for insert
  with check (trip_id in (select get_my_trip_ids()) and auth.uid() = created_by);

create policy "Trip members can delete invites" on trip_invites for delete
  using (trip_id in (select get_my_trip_ids()));
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Open your Supabase project → SQL Editor → paste and run the migration block above.
Verify: go to Table Editor, check `trips` has `budget`, `expenses` has `service_charge_pct` and `tax_pct`, `trip_members` has `permissions`, and `trip_invites` table exists.

- [ ] **Step 3: Commit**

```bash
git add supabase-schema.sql
git commit -m "feat: add migration for budget, charges, permissions, trip_invites"
```

---

## Task 2: Install Dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install React Query**

```bash
npx expo install @tanstack/react-query
```

- [ ] **Step 2: Install QR code and view-shot packages**

```bash
npx expo install react-native-qrcode-svg react-native-view-shot
```

- [ ] **Step 3: Verify installs**

```bash
npx expo install --check
```

Expected: no version mismatch warnings for the new packages.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add react-query, qrcode-svg, view-shot dependencies"
```

---

## Task 3: Update TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Replace src/types/index.ts with updated types**

```typescript
export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type TripPermissions = {
  add_expense: boolean
  edit_expense: boolean
  delete_expense: boolean
  invite_member: boolean
}

export const DEFAULT_MEMBER_PERMISSIONS: TripPermissions = {
  add_expense: true,
  edit_expense: true,
  delete_expense: true,
  invite_member: true,
}

export type Trip = {
  id: string
  name: string
  destination: string
  base_currency: string
  budget: number | null
  start_date: string | null
  end_date: string | null
  created_by: string
  created_at: string
}

export type TripMember = {
  id: string
  trip_id: string
  user_id: string
  role: 'owner' | 'member'
  permissions: TripPermissions
  joined_at: string
  profile?: Profile
}

export type TripInvite = {
  id: string
  trip_id: string
  token: string
  created_by: string
  created_at: string
  expires_at: string | null
}

export type Expense = {
  id: string
  trip_id: string
  paid_by: string
  title: string
  amount: number
  currency: string
  amount_in_base: number
  exchange_rate: number
  service_charge_pct: number
  tax_pct: number
  category: ExpenseCategory
  date: string
  created_at: string
  paid_by_profile?: Profile
  participants?: ExpenseParticipant[]
}

export type ExpenseParticipant = {
  id: string
  expense_id: string
  user_id: string
  share_amount: number
  profile?: Profile
}

export type Settlement = {
  id: string
  trip_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  currency: string
  settled_at: string
  from_profile?: Profile
  to_profile?: Profile
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'shopping'
  | 'other'

export type DebtSummary = {
  from: Profile
  to: Profile
  amount: number
  currency: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: update types for budget, charges, permissions, invites"
```

---

## Task 4: React Query Provider

**Files:**
- Create: `src/providers/QueryProvider.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Create QueryProvider**

```typescript
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export default function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

- [ ] **Step 2: Wrap App.tsx with QueryProvider**

```typescript
// App.tsx
import 'react-native-url-polyfill/auto'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import {
  useFonts,
  CormorantGaramond_400Regular,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans'
import AppNavigator from './src/navigation/AppNavigator'
import QueryProvider from './src/providers/QueryProvider'
import { colors } from './src/theme'

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.ocean} />
      </View>
    )
  }

  return (
    <QueryProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </QueryProvider>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/providers/QueryProvider.tsx App.tsx
git commit -m "feat: add React Query provider"
```

---

## Task 5: Data Hooks

**Files:**
- Create: `src/hooks/useTrips.ts`
- Create: `src/hooks/useTrip.ts`
- Create: `src/hooks/useExpenses.ts`
- Create: `src/hooks/useMembers.ts`
- Create: `src/hooks/useExchangeRate.ts`
- Create: `src/hooks/useSettlements.ts`

- [ ] **Step 1: Create useTrips.ts**

```typescript
// src/hooks/useTrips.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Trip } from '../types'

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Trip[]
    },
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      destination: string
      base_currency: string
      budget: number | null
      start_date: string | null
      end_date: string | null
      created_by: string
    }) => {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert(input)
        .select()
        .single()
      if (tripError) throw tripError

      const { error: memberError } = await supabase
        .from('trip_members')
        .insert({ trip_id: trip.id, user_id: input.created_by, role: 'owner' })
      if (memberError) throw memberError

      return trip as Trip
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trip> & { id: string }) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Trip
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['trip', trip.id] })
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase.from('trips').delete().eq('id', tripId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
}
```

- [ ] **Step 2: Create useTrip.ts**

```typescript
// src/hooks/useTrip.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Trip, TripMember } from '../types'

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single()
      if (error) throw error
      return data as Trip
    },
    enabled: !!tripId,
  })
}
```

- [ ] **Step 3: Create useMembers.ts**

```typescript
// src/hooks/useMembers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TripMember, TripPermissions, DEFAULT_MEMBER_PERMISSIONS } from '../types'

export function useMembers(tripId: string) {
  return useQuery({
    queryKey: ['members', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_members')
        .select('*, profile:profiles(*)')
        .eq('trip_id', tripId)
      if (error) throw error
      return (data ?? []).map((m: any) => ({
        ...m,
        permissions: m.permissions ?? DEFAULT_MEMBER_PERMISSIONS,
      })) as TripMember[]
    },
    enabled: !!tripId,
  })
}

export function useUpdateMemberPermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      memberId,
      tripId,
      permissions,
    }: {
      memberId: string
      tripId: string
      permissions: TripPermissions
    }) => {
      const { error } = await supabase
        .from('trip_members')
        .update({ permissions })
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['members', vars.tripId] }),
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, tripId }: { memberId: string; tripId: string }) => {
      const { error } = await supabase
        .from('trip_members')
        .delete()
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['members', vars.tripId] }),
  })
}
```

- [ ] **Step 4: Create useExpenses.ts**

```typescript
// src/hooks/useExpenses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Expense } from '../types'

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, paid_by_profile:profiles!paid_by(*), participants:expense_participants(*, profile:profiles(*))')
        .eq('trip_id', tripId)
        .order('date', { ascending: false })
      if (error) throw error
      return data as Expense[]
    },
    enabled: !!tripId,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      expense,
      participantIds,
      splitEvenly,
      customShares,
    }: {
      expense: Omit<Expense, 'id' | 'created_at' | 'paid_by_profile' | 'participants'>
      participantIds: string[]
      splitEvenly: boolean
      customShares?: Record<string, number>
    }) => {
      const { data: created, error: expError } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single()
      if (expError) throw expError

      const shares = participantIds.map((userId) => ({
        expense_id: created.id,
        user_id: userId,
        share_amount: splitEvenly
          ? created.amount_in_base / participantIds.length
          : (customShares?.[userId] ?? 0),
      }))

      const { error: partError } = await supabase
        .from('expense_participants')
        .insert(shares)
      if (partError) throw partError

      return created as Expense
    },
    onSuccess: (expense) =>
      queryClient.invalidateQueries({ queryKey: ['expenses', expense.trip_id] }),
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      expenseId,
      tripId,
      updates,
      participantIds,
      splitEvenly,
      customShares,
    }: {
      expenseId: string
      tripId: string
      updates: Partial<Omit<Expense, 'id' | 'created_at' | 'paid_by_profile' | 'participants'>>
      participantIds: string[]
      splitEvenly: boolean
      customShares?: Record<string, number>
    }) => {
      const { data: updated, error: expError } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', expenseId)
        .select()
        .single()
      if (expError) throw expError

      await supabase.from('expense_participants').delete().eq('expense_id', expenseId)

      const amountInBase = updated.amount_in_base
      const shares = participantIds.map((userId) => ({
        expense_id: expenseId,
        user_id: userId,
        share_amount: splitEvenly
          ? amountInBase / participantIds.length
          : (customShares?.[userId] ?? 0),
      }))

      const { error: partError } = await supabase
        .from('expense_participants')
        .insert(shares)
      if (partError) throw partError

      return updated as Expense
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['expenses', vars.tripId] }),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ expenseId, tripId }: { expenseId: string; tripId: string }) => {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
      if (error) throw error
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['expenses', vars.tripId] }),
  })
}
```

- [ ] **Step 5: Create useExchangeRate.ts**

```typescript
// src/hooks/useExchangeRate.ts
import { useQuery } from '@tanstack/react-query'

type RatesResponse = {
  base: string
  rates: Record<string, number>
}

async function fetchRates(baseCurrency: string): Promise<RatesResponse> {
  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${baseCurrency}`
  )
  if (!res.ok) throw new Error('Failed to fetch exchange rates')
  return res.json()
}

export function useExchangeRate(baseCurrency: string, enabled = true) {
  return useQuery({
    queryKey: ['exchange-rates', baseCurrency],
    queryFn: () => fetchRates(baseCurrency),
    staleTime: 1000 * 60 * 60, // 1 hour cache
    enabled: enabled && !!baseCurrency,
  })
}

export function getRateToBase(
  rates: Record<string, number> | undefined,
  fromCurrency: string,
  baseCurrency: string
): number {
  if (fromCurrency === baseCurrency) return 1
  if (!rates) return 1
  // Frankfurter returns rates FROM base TO others
  // To convert FROM currency TO base: rate = 1 / rates[fromCurrency]
  const rate = rates[fromCurrency]
  return rate ? 1 / rate : 1
}
```

- [ ] **Step 6: Create useSettlements.ts**

```typescript
// src/hooks/useSettlements.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Settlement } from '../types'

export function useSettlements(tripId: string) {
  return useQuery({
    queryKey: ['settlements', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlements')
        .select('*, from_profile:profiles!from_user_id(*), to_profile:profiles!to_user_id(*)')
        .eq('trip_id', tripId)
        .order('settled_at', { ascending: false })
      if (error) throw error
      return data as Settlement[]
    },
    enabled: !!tripId,
  })
}

export function useCreateSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settlement: Omit<Settlement, 'id' | 'settled_at' | 'from_profile' | 'to_profile'>) => {
      const { data, error } = await supabase
        .from('settlements')
        .insert(settlement)
        .select()
        .single()
      if (error) throw error
      return data as Settlement
    },
    onSuccess: (settlement) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', settlement.trip_id] })
      queryClient.invalidateQueries({ queryKey: ['expenses', settlement.trip_id] })
    },
  })
}
```

- [ ] **Step 7: Commit all hooks**

```bash
git add src/hooks/
git commit -m "feat: add React Query data hooks for trips, expenses, members, rates, settlements"
```

---

## Task 6: Shared UI Components

**Files:**
- Create: `src/components/ui/AppButton.tsx`
- Create: `src/components/ui/AppInput.tsx`
- Create: `src/components/ui/AvatarInitials.tsx`
- Create: `src/components/ui/StatCard.tsx`
- Create: `src/components/ui/SectionHeader.tsx`
- Create: `src/components/ui/PillFilter.tsx`
- Create: `src/components/ui/CategoryIcon.tsx`

- [ ] **Step 1: Create AppButton.tsx**

```typescript
// src/components/ui/AppButton.tsx
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '../../theme'

type Variant = 'primary' | 'secondary' | 'danger'

type Props = {
  label: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

const BG: Record<Variant, string> = {
  primary: colors.sunset,
  secondary: colors.sand,
  danger: '#E53935',
}

const FG: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.text,
  danger: colors.white,
}

export default function AppButton({
  label, onPress, variant = 'primary', loading, disabled, style,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: BG[variant] }, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={FG[variant]} />
        : <Text style={[styles.label, { color: FG[variant] }]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: 'DMSans_600SemiBold', fontSize: 14 },
  disabled: { opacity: 0.5 },
})
```

- [ ] **Step 2: Create AppInput.tsx**

```typescript
// src/components/ui/AppInput.tsx
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native'
import { colors } from '../../theme'

type Props = TextInputProps & {
  label?: string
  error?: string
}

export default function AppInput({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.muted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.sunset },
  error: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.sunset },
})
```

- [ ] **Step 3: Create AvatarInitials.tsx**

```typescript
// src/components/ui/AvatarInitials.tsx
import { View, Text, StyleSheet } from 'react-native'

const PALETTE = ['#5B7FA6', '#C4784C', '#6A9A7A', '#8B7AC8']

type Props = {
  name: string
  index?: number
  size?: number
}

export default function AvatarInitials({ name, index = 0, size = 38 }: Props) {
  const letter = name.trim()[0]?.toUpperCase() ?? '?'
  const bg = PALETTE[index % PALETTE.length]
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.letter, { fontSize: size * 0.37 }]}>{letter}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center' },
  letter: { fontFamily: 'DMSans_600SemiBold', color: '#fff' },
})
```

- [ ] **Step 4: Create StatCard.tsx**

```typescript
// src/components/ui/StatCard.tsx
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme'
import Icon from '../Icon'

type Props = {
  iconName: string
  iconBg: string
  iconColor: string
  value: string
  label: string
}

export default function StatCard({ iconName, iconBg, iconColor, value, label }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Icon name={iconName as any} size={14} color={iconColor} />
      </View>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  value: { fontFamily: 'DMSans_600SemiBold', fontSize: 20, color: colors.text, lineHeight: 22 },
  label: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
})
```

- [ ] **Step 5: Create SectionHeader.tsx**

```typescript
// src/components/ui/SectionHeader.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../../theme'

type Props = {
  title: string
  linkLabel?: string
  onLink?: () => void
}

export default function SectionHeader({ title, linkLabel, onLink }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {linkLabel && onLink ? (
        <TouchableOpacity onPress={onLink}>
          <Text style={styles.link}>{linkLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: colors.text },
  link: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.ocean },
})
```

- [ ] **Step 6: Create PillFilter.tsx**

```typescript
// src/components/ui/PillFilter.tsx
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme'

type Props = {
  options: { label: string; value: string }[]
  selected: string
  onSelect: (value: string) => void
}

export default function PillFilter({ options, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((opt) => {
        const active = opt.value === selected
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  pill: { borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  pillActive: { backgroundColor: colors.night },
  pillInactive: { backgroundColor: colors.sand },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 12 },
  labelActive: { color: colors.white },
  labelInactive: { color: colors.muted },
})
```

- [ ] **Step 7: Create CategoryIcon.tsx**

```typescript
// src/components/ui/CategoryIcon.tsx
import { View, StyleSheet } from 'react-native'
import { categoryColor } from '../../theme'
import { ExpenseCategory } from '../../types'
import Icon from '../Icon'

const CATEGORY_ICON: Record<ExpenseCategory, string> = {
  food: 'fork',
  transport: 'car',
  accommodation: 'bed',
  activity: 'camera',
  shopping: 'bag',
  other: 'pin',
}

type Props = {
  category: ExpenseCategory
  size?: number
}

export default function CategoryIcon({ category, size = 40 }: Props) {
  const { bg, icon } = categoryColor[category] ?? categoryColor.other
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: bg }]}>
      <Icon name={CATEGORY_ICON[category] as any} size={size * 0.35} color={icon} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: { justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
})
```

- [ ] **Step 8: Commit all UI components**

```bash
git add src/components/ui/ src/providers/
git commit -m "feat: add shared UI components (Button, Input, Avatar, StatCard, etc.)"
```

---

## Phase 1 Complete ✓

Foundation is ready. All subsequent phases build on:
- Updated Supabase schema (budget, charges, permissions, trip_invites)
- Updated TypeScript types
- React Query installed and wired
- Data hooks for all entities
- Shared UI component library

**Next:** `2026-05-23-phase2-auth.md`
