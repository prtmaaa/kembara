# Phase 6 — Export Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a shareable trip summary image containing total spend, category breakdown, per-member contribution, and settlement list. Share via native share sheet.

**Architecture:** A hidden off-screen `View` (rendered but not visible) is captured by `react-native-view-shot` using `captureRef`. The resulting image URI is passed to `Share.share` (React Native built-in). No external dependencies beyond `react-native-view-shot` (already in Phase 1). Export button lives on TripDetailScreen.

**Prerequisite:** All previous phases complete. `react-native-view-shot` installed in Phase 1.

---

## File Map

**Create:**
- `src/screens/trips/ExportScreen.tsx`

**Modify:**
- `src/screens/trips/TripDetailScreen.tsx` — add Export button
- `src/navigation/AppNavigator.tsx` — add ExportScreen

---

## Task 1: Create ExportScreen

**Files:**
- Create: `src/screens/trips/ExportScreen.tsx`

The screen has two parts:
1. **Preview area** — a styled `View` (ref'd for capture) showing the summary card
2. **Share button** — triggers capture + share

- [ ] **Step 1: Create ExportScreen**

```typescript
import React, { useRef, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, ActivityIndicator, SafeAreaView,
} from 'react-native'
import ViewShot, { captureRef } from 'react-native-view-shot'
import { LinearGradient } from 'expo-linear-gradient'
import { useExpenses } from '../../hooks/useExpenses'
import { useMembers } from '../../hooks/useMembers'
import { useSettlements } from '../../hooks/useSettlements'
import { useTrip } from '../../hooks/useTrips'
import { calculateDebts } from '../../utils/debtCalculator'
import { Profile } from '../../types'
import { colors, categoryColor } from '../../theme'

const CAT_LABELS: Record<string, string> = {
  food: 'Food', transport: 'Transport', accommodation: 'Stay',
  activity: 'Activity', shopping: 'Shopping', other: 'Other',
}

export default function ExportScreen({ route, navigation }: any) {
  const { tripId } = route.params
  const cardRef = useRef<any>(null)
  const [sharing, setSharing] = React.useState(false)

  const { data: trip } = useTrip(tripId)
  const { data: expenses = [] } = useExpenses(tripId)
  const { data: memberRows = [] } = useMembers(tripId)
  const { data: settlements = [] } = useSettlements(tripId)

  const members = memberRows.map(m => m.profile).filter(Boolean) as Profile[]
  const baseCurrency = trip?.base_currency ?? 'IDR'

  const totalSpent = expenses.reduce((s, e) => s + e.amount_in_base, 0)

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount_in_base })
    return Object.entries(map).sort(([, a], [, b]) => b - a)
  }, [expenses])

  const memberContributions = useMemo(() => {
    const map: Record<string, { name: string; paid: number }> = {}
    expenses.forEach(e => {
      const profile = memberRows.find(m => m.user_id === e.paid_by)?.profile
      const name = profile?.full_name?.split(' ')[0] ?? profile?.email ?? 'Unknown'
      map[e.paid_by] = { name, paid: (map[e.paid_by]?.paid ?? 0) + e.amount_in_base }
    })
    return Object.values(map).sort((a, b) => b.paid - a.paid)
  }, [expenses, memberRows])

  const debts = useMemo(
    () => calculateDebts(expenses, members, baseCurrency),
    [expenses, members, baseCurrency]
  )

  async function handleShare() {
    setSharing(true)
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 0.95 })
      await Share.share({ url: uri, message: `Trip summary: ${trip?.name}` })
    } catch (e) {
      console.warn('Export failed:', e)
    }
    setSharing(false)
  }

  if (!trip) return <View style={styles.loader}><ActivityIndicator color={colors.ocean} /></View>

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <Text style={styles.h1}>Export</Text>
          <Text style={styles.sub}>{trip.name}</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Preview card — this gets captured */}
        <ViewShot ref={cardRef} options={{ format: 'png', quality: 0.95 }}>
          <View style={styles.card}>
            {/* Header */}
            <LinearGradient
              colors={['#1D4D7A', '#1D5E5A', '#206640']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.cardHeader}
            >
              <Text style={styles.cardBrand}>KEMBARA</Text>
              <Text style={styles.cardTripName}>{trip.name}</Text>
              <Text style={styles.cardDest}>{trip.destination.toUpperCase()}</Text>
              {trip.start_date && (
                <Text style={styles.cardDates}>{trip.start_date} – {trip.end_date ?? '...'}</Text>
              )}
            </LinearGradient>

            {/* Total */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionLabel}>TOTAL SPENT</Text>
              <Text style={styles.cardTotal}>{totalSpent.toLocaleString()} {baseCurrency}</Text>
              <Text style={styles.cardMeta}>{expenses.length} expenses · {members.length} travelers</Text>
            </View>

            {/* Category breakdown */}
            {categoryBreakdown.length > 0 && (
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionLabel}>BY CATEGORY</Text>
                {categoryBreakdown.map(([cat, amount]) => {
                  const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0
                  const { icon: iconColor } = categoryColor[cat] ?? categoryColor.other
                  return (
                    <View key={cat} style={styles.catRow}>
                      <Text style={styles.catName}>{CAT_LABELS[cat] ?? cat}</Text>
                      <View style={styles.catBarWrap}>
                        <View style={[styles.catBar, { width: `${Math.round(pct)}%`, backgroundColor: iconColor }]} />
                      </View>
                      <Text style={styles.catAmt}>{Math.round(pct)}%</Text>
                    </View>
                  )
                })}
              </View>
            )}

            {/* Member contributions */}
            {memberContributions.length > 0 && (
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionLabel}>BY MEMBER</Text>
                {memberContributions.map((m, i) => (
                  <View key={i} style={styles.memberRow}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberPaid}>{m.paid.toLocaleString()} {baseCurrency}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Settlements */}
            {debts.length > 0 && (
              <View style={[styles.cardSection, styles.cardSectionLast]}>
                <Text style={styles.cardSectionLabel}>SETTLEMENTS</Text>
                {debts.map((d, i) => (
                  <View key={i} style={styles.debtRow}>
                    <Text style={styles.debtFrom}>{d.from.full_name?.split(' ')[0] ?? d.from.email}</Text>
                    <Text style={styles.debtArrow}>owes</Text>
                    <Text style={styles.debtTo}>{d.to.full_name?.split(' ')[0] ?? d.to.email}</Text>
                    <Text style={styles.debtAmt}>{d.amount.toLocaleString()} {baseCurrency}</Text>
                  </View>
                ))}
              </View>
            )}

            {debts.length === 0 && (
              <View style={[styles.cardSection, styles.cardSectionLast, styles.allClearSection]}>
                <Text style={styles.allClearText}>✓ All settled up!</Text>
              </View>
            )}
          </View>
        </ViewShot>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.shareBtnText}>Share Summary</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeHeader: { backgroundColor: colors.night },
  header: { backgroundColor: colors.night, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20 },
  h1: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 32, color: colors.white },
  sub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  scroll: { padding: 18, gap: 18 },

  card: { backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  cardHeader: { padding: 24, gap: 4 },
  cardBrand: { fontFamily: 'DMSans_600SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
  cardTripName: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 28, color: colors.white, lineHeight: 30 },
  cardDest: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  cardDates: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  cardSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  cardSectionLast: { borderBottomWidth: 0 },
  cardSectionLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 10, color: colors.muted, letterSpacing: 1.2, textTransform: 'uppercase' },

  cardTotal: { fontFamily: 'DMSans_600SemiBold', fontSize: 28, color: colors.text },
  cardMeta: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catName: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.text, width: 80 },
  catBarWrap: { flex: 1, height: 4, backgroundColor: colors.sand, borderRadius: 100 },
  catBar: { height: '100%', borderRadius: 100 },
  catAmt: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.muted, width: 36, textAlign: 'right' },

  memberRow: { flexDirection: 'row', justifyContent: 'space-between' },
  memberName: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  memberPaid: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.text },

  debtRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  debtFrom: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.text },
  debtArrow: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  debtTo: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.text, flex: 1 },
  debtAmt: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.sunset },

  allClearSection: { alignItems: 'center' },
  allClearText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.forest },

  shareBtn: {
    backgroundColor: colors.sunset, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.sunset, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  shareBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: colors.white },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/trips/ExportScreen.tsx
git commit -m "feat: add ExportScreen with trip summary image generation and share"
```

---

## Task 2: Add Export button to TripDetailScreen

**Files:**
- Modify: `src/screens/trips/TripDetailScreen.tsx`

Add an Export button next to the Edit button in the hero section (visible to all members).

- [ ] **Step 1: Add export button to heroTop row**

In the hero section, find the `heroTop` View with the Edit button. Add an Export button alongside it:

```typescript
<View style={styles.heroTop}>
  <View style={styles.heroBadge}>
    <View style={styles.heroDot} />
    <Text style={styles.heroBadgeText}>ACTIVE TRIP</Text>
  </View>
  <View style={styles.heroActions}>
    <TouchableOpacity
      style={styles.heroActionBtn}
      onPress={() => navigation.navigate('Export', { tripId })}
    >
      <Text style={styles.heroActionBtnText}>↑ Export</Text>
    </TouchableOpacity>
    {isOwner && (
      <TouchableOpacity
        style={styles.heroActionBtn}
        onPress={() => navigation.navigate('EditTrip', { tripId })}
      >
        <Text style={styles.heroActionBtnText}>Edit</Text>
      </TouchableOpacity>
    )}
  </View>
</View>
```

Add to styles:
```typescript
heroActions: { flexDirection: 'row', gap: 8 },
heroActionBtn: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
heroActionBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.white },
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/trips/TripDetailScreen.tsx
git commit -m "feat: add Export button to TripDetailScreen hero"
```

---

## Task 3: Add ExportScreen to Navigation

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Add import and screen**

Add import:
```typescript
import ExportScreen from '../screens/trips/ExportScreen'
```

Add screen inside `AppStack`:
```typescript
<Stack.Screen
  name="Export"
  component={ExportScreen}
  options={{ headerShown: false }}
/>
```

- [ ] **Step 2: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "feat: add ExportScreen to navigation"
```

---

## Phase 6 Complete ✓ — MVP Ready

**Test manually:**
- TripDetailScreen → "Export" button → ExportScreen loads with correct data
- Preview card shows: trip name, total, category breakdown, member contributions, settlements
- "Share Summary" → native share sheet opens with image
- Works for trips with no budget, no settlements, single member

---

## MVP Launch Checklist

After Phase 6, verify:
- [ ] Auth: register → email confirm → login → profile edit
- [ ] Create trip with budget → budget bar shows on Home
- [ ] Invite via link → another account joins via deep link
- [ ] Add expenses (multiple currencies, with charges) → amounts correct
- [ ] Edit + delete expense
- [ ] Settlement screen → debts calculated, mark as settled
- [ ] Export → share image works
- [ ] `.env` file has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set

**V1.1 next steps:**
- Offline mode (SQLite + Supabase sync)
- Push notifications
