# Phase 3 — Trip Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild trip management screens to use React Query hooks, add budget field, redesign invite flow (link + QR replaces email-only), and add per-member permission management.

**Architecture:** All screens consume data via hooks from Phase 1. InviteMemberScreen is a complete rewrite. Two new screens added: JoinTripScreen (handles invite deep links) and MemberPermissionsScreen (per-member permission toggles). Deep linking configured via Expo Linking.

**Prerequisite:** Phase 1 complete (hooks, types, shared components available).

---

## File Map

**Modify:**
- `src/screens/trips/TripListScreen.tsx` — use `useTrips` hook, fix budget bar with real data
- `src/screens/trips/CreateTripScreen.tsx` — add budget field, use `useCreateTrip`
- `src/screens/trips/EditTripScreen.tsx` — add budget field, use `useTrip` + `useUpdateTrip`
- `src/screens/trips/TripDetailScreen.tsx` — use React Query hooks, fix budget bar, add Settle Up button
- `src/screens/trips/InviteMemberScreen.tsx` — complete rewrite: invite link + QR + email search + member list
- `src/navigation/AppNavigator.tsx` — add JoinTripScreen, MemberPermissionsScreen, deep link config

**Create:**
- `src/screens/trips/JoinTripScreen.tsx`
- `src/screens/trips/MemberPermissionsScreen.tsx`

---

## Task 1: Update TripListScreen (Home Dashboard)

**Files:**
- Modify: `src/screens/trips/TripListScreen.tsx`

Key changes from current version:
- Replace manual `useEffect + supabase` with `useTrips()` hook
- Budget bar uses real `trip.budget` — show progress only when budget is set
- `memberCounts` and `totalSpent` derived from `useTrips` supplementary queries

- [ ] **Step 1: Replace TripListScreen**

```typescript
import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Line } from 'react-native-svg'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useTrips } from '../../hooks/useTrips'
import { Trip } from '../../types'
import { colors } from '../../theme'
import { useAuth } from '../../hooks/useAuth'
import { useActiveTrip } from '../../context/ActiveTripContext'
import Icon from '../../components/Icon'
import StatCard from '../../components/ui/StatCard'
import SectionHeader from '../../components/ui/SectionHeader'

const AVATAR_COLORS = ['#5B7FA6', '#C4784C', '#6A9A7A', '#8B7AC8']
const TRIP_GRADIENTS = [
  ['#1D4D7A', '#1D5E5A', '#206640'] as const,
  ['#7A3020', '#7A5010', '#5A5020'] as const,
  ['#5a3580', '#2a3a7a', '#1a4a7a'] as const,
  ['#903070', '#803850', '#5A2040'] as const,
]

function GridPattern() {
  return (
    <Svg style={StyleSheet.absoluteFill as any} width="100%" height="210">
      {Array.from({ length: 9 }).map((_, i) => (
        <Line key={`h${i}`} x1="0" y1={i * 28} x2="500" y2={i * 28} stroke="white" strokeWidth="1" opacity="0.08" />
      ))}
      {Array.from({ length: 18 }).map((_, i) => (
        <Line key={`v${i}`} x1={i * 28} y1="0" x2={i * 28} y2="210" stroke="white" strokeWidth="1" opacity="0.08" />
      ))}
    </Svg>
  )
}

function daysLeft(endDate: string | null) {
  if (!endDate) return null
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
  return diff > 0 ? diff : null
}

function tripDays(start: string | null, end: string | null) {
  if (!start || !end) return null
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1
}

function formatShort(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toFixed(0)
}

export default function TripListScreen({ navigation }: any) {
  const { profile } = useAuth()
  const { setActiveTripId } = useActiveTrip()
  const { data: trips = [], isLoading } = useTrips()

  const tripIds = trips.map(t => t.id)

  const { data: memberCounts = {} } = useQuery({
    queryKey: ['trip-member-counts', tripIds],
    queryFn: async () => {
      if (!tripIds.length) return {}
      const { data } = await supabase
        .from('trip_members').select('trip_id').in('trip_id', tripIds)
      const mc: Record<string, number> = {}
      data?.forEach(m => { mc[m.trip_id] = (mc[m.trip_id] ?? 0) + 1 })
      return mc
    },
    enabled: tripIds.length > 0,
  })

  const { data: totalSpent = {} } = useQuery({
    queryKey: ['trip-totals', tripIds],
    queryFn: async () => {
      if (!tripIds.length) return {}
      const { data } = await supabase
        .from('expenses').select('trip_id, amount_in_base').in('trip_id', tripIds)
      const ts: Record<string, number> = {}
      data?.forEach(e => { ts[e.trip_id] = (ts[e.trip_id] ?? 0) + e.amount_in_base })
      return ts
    },
    enabled: tripIds.length > 0,
  })

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? ''
  const avatarLetter = firstName[0]?.toUpperCase() ?? '?'
  const heroTrip = trips[0]
  const otherTrips = trips.slice(1)

  React.useEffect(() => {
    if (heroTrip) setActiveTripId(heroTrip.id)
  }, [heroTrip?.id])

  function openTrip(trip: Trip) {
    setActiveTripId(trip.id)
    navigation.navigate('TripDetail', { tripId: trip.id, tripName: trip.name })
  }

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const heroSpent = heroTrip ? (totalSpent[heroTrip.id] ?? 0) : 0
  const heroMembers = heroTrip ? (memberCounts[heroTrip.id] ?? 1) : 0
  const heroDaysLeft = heroTrip ? daysLeft(heroTrip.end_date) : null
  const heroTotalDays = heroTrip ? tripDays(heroTrip.start_date, heroTrip.end_date) : null
  const heroBudget = heroTrip?.budget ?? null
  const budgetPct = heroBudget && heroSpent > 0 ? Math.min(heroSpent / heroBudget, 1) : null

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>{firstName ? `${firstName}'s Trips` : 'My Trips'}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[0] }]}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.ocean} size="large" /></View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySub}>Tap the button below to start your adventure</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {heroTrip && (
            <TouchableOpacity style={styles.heroWrap} onPress={() => openTrip(heroTrip)} activeOpacity={0.9}>
              <LinearGradient colors={TRIP_GRADIENTS[0] as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGrad}>
                <GridPattern />
                <LinearGradient colors={['transparent', 'rgba(12,15,30,0.72)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill as any} />
                <View style={styles.heroBody}>
                  <View style={styles.heroBadge}>
                    <View style={styles.heroDot} />
                    <Text style={styles.heroBadgeText}>ACTIVE TRIP</Text>
                  </View>
                  <View>
                    <Text style={styles.heroLoc} numberOfLines={1}>{heroTrip.destination.toUpperCase()}</Text>
                    <Text style={styles.heroName} numberOfLines={2}>{heroTrip.name}</Text>
                    {heroTrip.start_date ? (
                      <Text style={styles.heroDates}>
                        {heroTrip.start_date} – {heroTrip.end_date ?? '...'}
                        {heroTotalDays ? ` · ${heroTotalDays} days` : ''}
                        {heroDaysLeft ? ` · ${heroDaysLeft} left` : ''}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {heroTrip && (
            <View style={styles.statsRow}>
              <StatCard
                iconName="receipt"
                iconBg={colors.sunsetSoft}
                iconColor={colors.sunset}
                value={heroSpent > 0 ? formatShort(heroSpent) : '0'}
                label={`${heroTrip.base_currency} spent`}
              />
              <StatCard
                iconName="calendar"
                iconBg={colors.oceanSoft}
                iconColor={colors.ocean}
                value={String(heroDaysLeft ?? heroTotalDays ?? '—')}
                label={heroDaysLeft ? 'Days left' : 'Total days'}
              />
              <StatCard
                iconName="users"
                iconBg={colors.forestSoft}
                iconColor={colors.forest}
                value={String(heroMembers)}
                label="Travelers"
              />
            </View>
          )}

          {heroTrip && budgetPct !== null && (
            <View>
              <SectionHeader
                title="Budget Overview"
                linkLabel="Details →"
                onLink={() => openTrip(heroTrip)}
              />
              <View style={styles.budgetCard}>
                <View style={styles.budgetTop}>
                  <Text style={styles.budgetSpent}>
                    {heroSpent.toLocaleString()}
                    <Text style={styles.budgetSpentLabel}> spent</Text>
                  </Text>
                  <Text style={styles.budgetSub}>of {heroBudget!.toLocaleString()} {heroTrip.base_currency}</Text>
                </View>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={budgetPct > 0.9 ? [colors.sunset, '#E53935'] : [colors.ocean, colors.forest]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.barFill, { width: `${Math.round(budgetPct * 100)}%` }]}
                  />
                </View>
                <Text style={styles.budgetMeta}>{Math.round(budgetPct * 100)}% used · {heroMembers} travelers</Text>
              </View>
            </View>
          )}

          {otherTrips.length > 0 && (
            <View>
              <SectionHeader title="Upcoming Trips" />
              {otherTrips.map((trip, index) => {
                const g = TRIP_GRADIENTS[(index + 1) % TRIP_GRADIENTS.length]
                return (
                  <TouchableOpacity key={trip.id} style={styles.listItem} onPress={() => openTrip(trip)} activeOpacity={0.75}>
                    <LinearGradient colors={[g[0], g[1]] as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.listSwatch} />
                    <View style={styles.listInfo}>
                      <Text style={styles.listName} numberOfLines={1}>{trip.name}</Text>
                      <Text style={styles.listDate} numberOfLines={1}>
                        {trip.start_date
                          ? `${trip.start_date} – ${trip.end_date ?? '...'} · ${memberCounts[trip.id] ?? 1} travelers`
                          : trip.destination}
                      </Text>
                    </View>
                    <Icon name="chevronR" size={16} color={colors.border} />
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateTrip')} activeOpacity={0.85}>
        <Icon name="plus" size={16} color="white" />
        <Text style={styles.fabText}>New Trip</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  safeHeader: { backgroundColor: colors.night },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24, backgroundColor: colors.night },
  greeting: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 28, color: colors.white, lineHeight: 30 },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.white },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 26, color: colors.text },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  content: { padding: 18, gap: 18 },
  heroWrap: { height: 210, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 10 },
  heroGrad: { flex: 1 },
  heroBody: { flex: 1, padding: 16, justifyContent: 'space-between' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  heroBadgeText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.white, letterSpacing: 0.6 },
  heroLoc: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: 'rgba(180,215,240,0.85)', letterSpacing: 1.2, marginBottom: 4 },
  heroName: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 34, color: colors.white, lineHeight: 36, letterSpacing: -0.3 },
  heroDates: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(180,200,230,0.8)', marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10 },
  budgetCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  budgetSpent: { fontFamily: 'DMSans_600SemiBold', fontSize: 22, color: colors.text },
  budgetSpentLabel: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.muted },
  budgetSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  barTrack: { height: 6, backgroundColor: colors.sand, borderRadius: 100, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 100 },
  budgetMeta: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 8, textAlign: 'right' },
  listItem: { backgroundColor: colors.white, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  listSwatch: { width: 48, height: 48, borderRadius: 12, flexShrink: 0 },
  listInfo: { flex: 1 },
  listName: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.text },
  listDate: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  fab: { position: 'absolute', bottom: 22, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.sunset, borderRadius: 100, paddingVertical: 14, paddingHorizontal: 28, shadowColor: colors.sunset, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8 },
  fabText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.white },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/trips/TripListScreen.tsx
git commit -m "feat: update TripListScreen to use React Query hooks and real budget data"
```

---

## Task 2: Update CreateTripScreen

**Files:**
- Modify: `src/screens/trips/CreateTripScreen.tsx`

Key changes: add budget field, replace direct Supabase call with `useCreateTrip` mutation, use `AppInput` + `AppButton`.

- [ ] **Step 1: Rewrite CreateTripScreen**

```typescript
import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useCreateTrip } from '../../hooks/useTrips'
import { colors } from '../../theme'
import AppInput from '../../components/ui/AppInput'
import AppButton from '../../components/ui/AppButton'

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD', 'GBP', 'THB']

export default function CreateTripScreen({ navigation }: any) {
  const { profile } = useAuth()
  const createTrip = useCreateTrip()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('IDR')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim() || !destination.trim()) {
      setError('Trip name and destination are required.')
      return
    }
    if (!profile) return
    setError('')
    try {
      await createTrip.mutateAsync({
        name: name.trim(),
        destination: destination.trim(),
        base_currency: baseCurrency,
        budget: budget ? parseFloat(budget) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        created_by: profile.id,
      })
      navigation.goBack()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.form}>
        <AppInput label="Trip Name" placeholder="e.g. Bali Trip 2025" value={name} onChangeText={setName} />
        <AppInput label="Destination" placeholder="e.g. Bali, Indonesia" value={destination} onChangeText={setDestination} />

        <Text style={styles.label}>Base Currency</Text>
        <View style={styles.chips}>
          {CURRENCIES.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, baseCurrency === c && styles.chipActive]} onPress={() => setBaseCurrency(c)}>
              <Text style={[styles.chipText, baseCurrency === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <AppInput
          label="Total Budget (optional)"
          placeholder={`0 ${baseCurrency}`}
          value={budget}
          onChangeText={setBudget}
          keyboardType="decimal-pad"
        />
        <AppInput label="Start Date (optional)" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
        <AppInput label="End Date (optional)" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />

        <AppButton label="Create Trip" onPress={handleCreate} loading={createTrip.isPending} style={styles.btn} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24 },
  form: { gap: 16 },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.night, borderColor: colors.night },
  chipText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.white },
  btn: { marginTop: 8 },
  error: { fontFamily: 'DMSans_400Regular', color: colors.sunset, marginBottom: 8, fontSize: 13 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/trips/CreateTripScreen.tsx
git commit -m "feat: update CreateTripScreen with budget field and React Query"
```

---

## Task 3: Update EditTripScreen

**Files:**
- Modify: `src/screens/trips/EditTripScreen.tsx`

Key changes: load trip via `useTrip`, add budget field, use `useUpdateTrip`.

- [ ] **Step 1: Rewrite EditTripScreen**

```typescript
import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTrip, useUpdateTrip } from '../../hooks/useTrips'
import { colors } from '../../theme'
import AppInput from '../../components/ui/AppInput'
import AppButton from '../../components/ui/AppButton'

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD', 'GBP', 'THB']

export default function EditTripScreen({ route, navigation }: any) {
  const { tripId } = route.params
  const { data: trip, isLoading } = useTrip(tripId)
  const updateTrip = useUpdateTrip()

  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('IDR')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (trip) {
      setName(trip.name)
      setDestination(trip.destination)
      setBaseCurrency(trip.base_currency)
      setBudget(trip.budget ? String(trip.budget) : '')
      setStartDate(trip.start_date ?? '')
      setEndDate(trip.end_date ?? '')
    }
  }, [trip])

  async function handleSave() {
    if (!name.trim() || !destination.trim()) {
      setError('Trip name and destination are required.')
      return
    }
    setError('')
    try {
      await updateTrip.mutateAsync({
        id: tripId,
        name: name.trim(),
        destination: destination.trim(),
        base_currency: baseCurrency,
        budget: budget ? parseFloat(budget) : null,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      navigation.goBack()
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (isLoading) return <View style={styles.loader}><ActivityIndicator color={colors.ocean} /></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.form}>
        <AppInput label="Trip Name" value={name} onChangeText={setName} />
        <AppInput label="Destination" value={destination} onChangeText={setDestination} />

        <Text style={styles.label}>Base Currency</Text>
        <View style={styles.chips}>
          {CURRENCIES.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, baseCurrency === c && styles.chipActive]} onPress={() => setBaseCurrency(c)}>
              <Text style={[styles.chipText, baseCurrency === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <AppInput label="Total Budget (optional)" placeholder={`0 ${baseCurrency}`} value={budget} onChangeText={setBudget} keyboardType="decimal-pad" />
        <AppInput label="Start Date (optional)" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
        <AppInput label="End Date (optional)" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />

        <AppButton label="Save Changes" onPress={handleSave} loading={updateTrip.isPending} style={styles.btn} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { gap: 16 },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.night, borderColor: colors.night },
  chipText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.white },
  btn: { marginTop: 8 },
  error: { fontFamily: 'DMSans_400Regular', color: colors.sunset, marginBottom: 8, fontSize: 13 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/trips/EditTripScreen.tsx
git commit -m "feat: update EditTripScreen with budget field and React Query"
```

---

## Task 4: Update TripDetailScreen

**Files:**
- Modify: `src/screens/trips/TripDetailScreen.tsx`

Key changes: use `useTrip` + `useExpenses` + `useMembers` hooks, fix budget bar with real data, add "Settle Up" button.

- [ ] **Step 1: Replace data fetching (top of component)**

Remove the `useState`/`useEffect`/`fetchData` block and replace with:

```typescript
import { useTrip } from '../../hooks/useTrips'
import { useExpenses } from '../../hooks/useExpenses'
import { useMembers } from '../../hooks/useMembers'
import { useAuth } from '../../hooks/useAuth'

// Inside component:
const { profile } = useAuth()
const { data: trip, isLoading: tripLoading } = useTrip(tripId)
const { data: expenses = [], isLoading: expLoading } = useExpenses(tripId)
const { data: memberRows = [] } = useMembers(tripId)
const members = memberRows.map(m => m.profile).filter(Boolean) as Profile[]
const isLoading = tripLoading || expLoading
const isOwner = trip?.created_by === profile?.id
```

- [ ] **Step 2: Fix budget bar calculation**

Replace the hardcoded `width: '65%'` in the budget bar with real data:

```typescript
const totalInBase = expenses.reduce((s, e) => s + e.amount_in_base, 0)
const budget = trip?.budget ?? null
const budgetPct = budget && totalInBase > 0 ? Math.min(totalInBase / budget, 1) : null

// In JSX, change the budget section condition and bar width:
{totalInBase > 0 && (
  <View style={styles.budgetCard}>
    <View style={styles.budgetRow}>
      <Text style={styles.budgetAmt}>
        {totalInBase.toLocaleString()}
        <Text style={styles.budgetCur}> {trip?.base_currency}</Text>
      </Text>
      <Text style={styles.budgetLabel}>
        {budget ? `of ${budget.toLocaleString()} budget` : 'total spent'}
      </Text>
    </View>
    {budgetPct !== null && (
      <View style={styles.barTrack}>
        <LinearGradient
          colors={budgetPct > 0.9 ? [colors.sunset, '#E53935'] : [colors.ocean, colors.forest]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${Math.round(budgetPct * 100)}%` }]}
        />
      </View>
    )}
    <View style={styles.budgetMeta}>
      <Text style={styles.budgetMetaText}>{members.length} travelers</Text>
      {budgetPct !== null && <Text style={styles.budgetMetaText}>{Math.round(budgetPct * 100)}% used</Text>}
    </View>
  </View>
)}
```

- [ ] **Step 3: Add "Settle Up" button in the debt section**

Replace the current debt card with this version that has a Settle Up button:

```typescript
{debts.length > 0 && (
  <View style={styles.debtCard}>
    <View style={styles.debtHeader}>
      <Text style={styles.debtTitle}>Settlements</Text>
      <TouchableOpacity
        style={styles.settleBtn}
        onPress={() => navigation.navigate('Settlement', { tripId })}
      >
        <Text style={styles.settleBtnText}>Settle Up →</Text>
      </TouchableOpacity>
    </View>
    {debts.slice(0, 3).map((d, i) => (
      <View key={i} style={styles.debtRow}>
        <View style={[styles.debtAvatar, { backgroundColor: AVATAR_COLORS[i % 4] }]}>
          <Text style={styles.debtAvatarText}>{initials(d.from.full_name ?? d.from.email)}</Text>
        </View>
        <Text style={styles.debtText} numberOfLines={1}>
          <Text style={styles.debtName}>{d.from.full_name?.split(' ')[0] ?? d.from.email}</Text>
          <Text style={{ color: colors.muted }}> owes </Text>
          <Text style={styles.debtName}>{d.to.full_name?.split(' ')[0] ?? d.to.email}</Text>
        </Text>
        <Text style={styles.debtAmt}>{d.amount.toLocaleString()}</Text>
      </View>
    ))}
    {debts.length > 3 && (
      <TouchableOpacity onPress={() => navigation.navigate('Settlement', { tripId })}>
        <Text style={styles.debtMore}>+{debts.length - 3} more · View all →</Text>
      </TouchableOpacity>
    )}
  </View>
)}
```

Add to styles:
```typescript
debtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
settleBtn: { backgroundColor: colors.sunsetSoft, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
settleBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.sunset },
debtMore: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.ocean, marginTop: 8, textAlign: 'center' },
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/trips/TripDetailScreen.tsx
git commit -m "feat: update TripDetailScreen with React Query, real budget bar, Settle Up button"
```

---

## Task 5: Rewrite InviteMemberScreen

**Files:**
- Modify: `src/screens/trips/InviteMemberScreen.tsx`

Complete rewrite. New sections:
1. **Invite Link** — generate token, copy to clipboard, share
2. **QR Code** — show QR modal
3. **Member List** — members with role badge, remove button (owner only), tap → MemberPermissionsScreen

Remove: email search (too friction-heavy; link-based invite is primary method for v1)

- [ ] **Step 1: Rewrite InviteMemberScreen**

```typescript
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, Alert, Modal, SafeAreaView,
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useMembers, useRemoveMember } from '../../hooks/useMembers'
import { useAuth } from '../../hooks/useAuth'
import { useTrip } from '../../hooks/useTrips'
import { colors } from '../../theme'
import AvatarInitials from '../../components/ui/AvatarInitials'
import AppButton from '../../components/ui/AppButton'
import Icon from '../../components/Icon'

function generateToken() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
}

export default function InviteMemberScreen({ route, navigation }: any) {
  const { tripId } = route.params
  const { profile } = useAuth()
  const { data: trip } = useTrip(tripId)
  const { data: memberRows = [] } = useMembers(tripId)
  const removeMember = useRemoveMember()
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  const isOwner = trip?.created_by === profile?.id
  const inviteLink = token ? `kembara://join/${token}` : null

  const generateInvite = useMutation({
    mutationFn: async () => {
      const newToken = generateToken()
      const { error } = await supabase.from('trip_invites').insert({
        trip_id: tripId,
        token: newToken,
        created_by: profile!.id,
      })
      if (error) throw error
      return newToken
    },
    onSuccess: (newToken) => setToken(newToken),
  })

  async function shareLink() {
    if (!inviteLink) return
    await Share.share({
      message: `Join my trip "${trip?.name}" on Kembara!\n\nOpen this link: ${inviteLink}`,
    })
  }

  function confirmRemove(memberId: string, memberName: string) {
    Alert.alert('Remove Member', `Remove ${memberName} from this trip?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => removeMember.mutate({ memberId, tripId }),
      },
    ])
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Invite link section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite via Link</Text>
          <Text style={styles.sectionSub}>Share this link with anyone you want to invite</Text>

          {!token ? (
            <AppButton
              label="Generate Invite Link"
              onPress={() => generateInvite.mutate()}
              loading={generateInvite.isPending}
            />
          ) : (
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>{inviteLink}</Text>
              <View style={styles.linkActions}>
                <TouchableOpacity style={styles.linkBtn} onPress={shareLink}>
                  <Icon name="share" size={16} color={colors.ocean} />
                  <Text style={styles.linkBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkBtn} onPress={() => setShowQR(true)}>
                  <Icon name="qr" size={16} color={colors.ocean} />
                  <Text style={styles.linkBtnText}>QR Code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkBtn} onPress={() => { setToken(null); generateInvite.reset() }}>
                  <Text style={styles.linkBtnText}>Revoke</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({memberRows.length})</Text>
          {memberRows.map((member, i) => {
            const name = member.profile?.full_name ?? member.profile?.email ?? 'Unknown'
            const isSelf = member.user_id === profile?.id
            const isThisOwner = member.role === 'owner'
            return (
              <View key={member.id} style={styles.memberRow}>
                <AvatarInitials name={name} index={i} size={40} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{name}</Text>
                  <Text style={styles.memberRole}>{isThisOwner ? 'Owner' : 'Member'}</Text>
                </View>
                {isOwner && !isSelf && !isThisOwner && (
                  <View style={styles.memberActions}>
                    <TouchableOpacity
                      style={styles.permBtn}
                      onPress={() => navigation.navigate('MemberPermissions', { memberId: member.id, tripId, memberName: name })}
                    >
                      <Text style={styles.permBtnText}>Permissions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmRemove(member.id, name)}>
                      <Icon name="trash" size={16} color={colors.sunset} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* QR Modal */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowQR(false)} activeOpacity={1}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Scan to Join</Text>
            <Text style={styles.modalSub}>{trip?.name}</Text>
            <View style={styles.qrWrap}>
              {inviteLink && <QRCode value={inviteLink} size={200} />}
            </View>
            <Text style={styles.modalHint}>Tap anywhere to close</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: colors.text },
  sectionSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  linkBox: { backgroundColor: colors.white, borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  linkText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.ocean },
  linkActions: { flexDirection: 'row', gap: 12 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.ocean },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text },
  memberRole: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  permBtn: { backgroundColor: colors.oceanSoft, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  permBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.ocean },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: colors.white, borderRadius: 24, padding: 28, alignItems: 'center', gap: 8, width: 280 },
  modalTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 24, color: colors.text },
  modalSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  qrWrap: { marginVertical: 16, padding: 12, backgroundColor: colors.white, borderRadius: 12 },
  modalHint: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
})
```

- [ ] **Step 2: Add `share` and `qr` and `trash` icons to Icon.tsx**

Open `src/components/Icon.tsx` and add these paths to the icon map:
```typescript
share: (
  <G>
    <Circle cx="18" cy="5" r="3" strokeWidth="1.8"/>
    <Circle cx="6" cy="12" r="3" strokeWidth="1.8"/>
    <Circle cx="18" cy="19" r="3" strokeWidth="1.8"/>
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeWidth="1.8"/>
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeWidth="1.8"/>
  </G>
),
trash: (
  <G>
    <Polyline points="3,6 5,6 21,6" strokeWidth="1.8"/>
    <Path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" strokeWidth="1.8"/>
    <Path d="M10,11v6" strokeWidth="1.8"/>
    <Path d="M14,11v6" strokeWidth="1.8"/>
    <Path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2" strokeWidth="1.8"/>
  </G>
),
qr: (
  <G>
    <Rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.8"/>
    <Rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.8"/>
    <Rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.8"/>
    <Path d="M14,14h3v3h-3z" strokeWidth="1.8"/>
    <Path d="M17,17h4v4h-4z" strokeWidth="1.8"/>
    <Path d="M14,21h3" strokeWidth="1.8"/>
    <Path d="M21,14v3" strokeWidth="1.8"/>
  </G>
),
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/trips/InviteMemberScreen.tsx src/components/Icon.tsx
git commit -m "feat: rewrite InviteMemberScreen with invite link, QR code, member permissions"
```

---

## Task 6: Add JoinTripScreen

**Files:**
- Create: `src/screens/trips/JoinTripScreen.tsx`

Handles the deep link `kembara://join/<token>`. Looks up the trip, shows trip name, adds the user as member on confirm.

- [ ] **Step 1: Create JoinTripScreen**

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'
import { DEFAULT_MEMBER_PERMISSIONS } from '../../types'

export default function JoinTripScreen({ route, navigation }: any) {
  const { token } = route.params
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [trip, setTrip] = useState<{ id: string; name: string; destination: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [alreadyMember, setAlreadyMember] = useState(false)

  useEffect(() => {
    lookupToken()
  }, [token])

  async function lookupToken() {
    const { data: invite } = await supabase
      .from('trip_invites')
      .select('trip_id, trips(id, name, destination)')
      .eq('token', token)
      .single()

    if (!invite) { setError('This invite link is invalid or has expired.'); setLoading(false); return }

    const tripData = invite.trips as any
    setTrip({ id: tripData.id, name: tripData.name, destination: tripData.destination })

    const { data: existing } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripData.id)
      .eq('user_id', profile!.id)
      .single()

    if (existing) setAlreadyMember(true)
    setLoading(false)
  }

  async function joinTrip() {
    if (!trip || !profile) return
    setJoining(true)
    const { error: err } = await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: profile.id,
      role: 'member',
      permissions: DEFAULT_MEMBER_PERMISSIONS,
    })
    if (err) { setError(err.message); setJoining(false); return }
    queryClient.invalidateQueries({ queryKey: ['trips'] })
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.ocean} size="large" /></View>

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Invalid Link</Text>
      <Text style={styles.errorSub}>{error}</Text>
      <AppButton label="Go Home" onPress={() => navigation.navigate('Main')} style={{ marginTop: 24 }} />
    </View>
  )

  return (
    <View style={styles.center}>
      <Text style={styles.label}>You've been invited to</Text>
      <Text style={styles.tripName}>{trip?.name}</Text>
      <Text style={styles.destination}>{trip?.destination}</Text>
      {alreadyMember ? (
        <>
          <Text style={styles.alreadyText}>You're already a member of this trip.</Text>
          <AppButton label="Open Trip" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} style={{ marginTop: 24 }} />
        </>
      ) : (
        <AppButton label="Join Trip" onPress={joinTrip} loading={joining} style={{ marginTop: 32 }} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center', alignItems: 'center', padding: 28 },
  label: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginBottom: 8 },
  tripName: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 36, color: colors.text, textAlign: 'center' },
  destination: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 6 },
  alreadyText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 16, textAlign: 'center' },
  errorTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 28, color: colors.text, marginBottom: 8 },
  errorSub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, textAlign: 'center' },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/trips/JoinTripScreen.tsx
git commit -m "feat: add JoinTripScreen for invite link deep link handling"
```

---

## Task 7: Add MemberPermissionsScreen

**Files:**
- Create: `src/screens/trips/MemberPermissionsScreen.tsx`

Shows all 4 permission toggles for a specific member. Only the trip owner can reach this screen.

- [ ] **Step 1: Create MemberPermissionsScreen**

```typescript
import React, { useState, useEffect } from 'react'
import { View, Text, Switch, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useMembers, useUpdateMemberPermissions } from '../../hooks/useMembers'
import { TripPermissions, DEFAULT_MEMBER_PERMISSIONS } from '../../types'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'

const PERMISSION_LABELS: { key: keyof TripPermissions; label: string; description: string }[] = [
  { key: 'add_expense', label: 'Add Expenses', description: 'Can add new expenses to the trip' },
  { key: 'edit_expense', label: 'Edit Any Expense', description: "Can edit anyone's expenses, not just their own" },
  { key: 'delete_expense', label: 'Delete Any Expense', description: "Can delete anyone's expenses" },
  { key: 'invite_member', label: 'Invite Members', description: 'Can generate invite links and add new members' },
]

export default function MemberPermissionsScreen({ route, navigation }: any) {
  const { memberId, tripId, memberName } = route.params
  const { data: memberRows = [], isLoading } = useMembers(tripId)
  const updatePermissions = useUpdateMemberPermissions()

  const member = memberRows.find(m => m.id === memberId)
  const [perms, setPerms] = useState<TripPermissions>(DEFAULT_MEMBER_PERMISSIONS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (member?.permissions) setPerms(member.permissions)
  }, [member])

  function toggle(key: keyof TripPermissions) {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  async function handleSave() {
    await updatePermissions.mutateAsync({ memberId, tripId, permissions: perms })
    setSaved(true)
    setTimeout(() => navigation.goBack(), 800)
  }

  if (isLoading) return <View style={styles.loader}><ActivityIndicator color={colors.ocean} /></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Permissions for {memberName}</Text>

      {PERMISSION_LABELS.map(({ key, label, description }) => (
        <View key={key} style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowDesc}>{description}</Text>
          </View>
          <Switch
            value={perms[key]}
            onValueChange={() => toggle(key)}
            trackColor={{ true: colors.ocean, false: colors.sand }}
            thumbColor={colors.white}
          />
        </View>
      ))}

      <AppButton
        label={saved ? 'Saved ✓' : 'Save Permissions'}
        onPress={handleSave}
        loading={updatePermissions.isPending}
        style={styles.btn}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, gap: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  rowInfo: { flex: 1 },
  rowLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.text },
  rowDesc: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  btn: { marginTop: 8 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/trips/MemberPermissionsScreen.tsx
git commit -m "feat: add MemberPermissionsScreen with granular permission toggles"
```

---

## Task 8: Update AppNavigator

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`

Add JoinTripScreen, MemberPermissionsScreen, SettlementScreen (referenced but built in Phase 5), and deep link config.

- [ ] **Step 1: Add imports and screens**

Add imports:
```typescript
import JoinTripScreen from '../screens/trips/JoinTripScreen'
import MemberPermissionsScreen from '../screens/trips/MemberPermissionsScreen'
```

Add screens inside `AppStack`'s `Stack.Navigator`:
```typescript
<Stack.Screen name="JoinTrip" component={JoinTripScreen} options={{ headerShown: false }} />
<Stack.Screen
  name="MemberPermissions"
  component={MemberPermissionsScreen}
  options={{ ...darkHeader, title: 'Permissions' }}
/>
```

- [ ] **Step 2: Add deep link config to NavigationContainer**

```typescript
const linking = {
  prefixes: ['kembara://'],
  config: {
    screens: {
      AppStack: {
        screens: {
          JoinTrip: 'join/:token',
        },
      },
    },
  },
}

// In AppNavigator return:
<NavigationContainer linking={linking}>
  {session ? <AppStack /> : <AuthStack />}
</NavigationContainer>
```

- [ ] **Step 3: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "feat: add JoinTripScreen, MemberPermissionsScreen to nav, configure deep links"
```

---

## Phase 3 Complete ✓

**Test manually:**
- Create trip with budget → budget bar shows real percentage on Home
- Edit trip → budget field pre-filled
- TripDetail → budget bar real, "Settle Up" button visible
- InviteMember → generate link → share/QR works
- Deep link `kembara://join/<token>` → JoinTripScreen → join works
- MemberPermissions → toggles save correctly

**Next:** `2026-05-23-phase4-expenses.md`
