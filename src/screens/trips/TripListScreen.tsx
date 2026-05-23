import React, { useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Line } from 'react-native-svg'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme'
import { useAuth } from '../../hooks/useAuth'
import { useActiveTrip } from '../../context/ActiveTripContext'
import { useTrips } from '../../hooks/useTrips'
import { Trip } from '../../types'
import Icon from '../../components/Icon'

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
        <Line key={`h${i}`} x1="0" y1={i * 28} x2="500" y2={i * 28}
          stroke="white" strokeWidth="1" opacity="0.08" />
      ))}
      {Array.from({ length: 18 }).map((_, i) => (
        <Line key={`v${i}`} x1={i * 28} y1="0" x2={i * 28} y2="210"
          stroke="white" strokeWidth="1" opacity="0.08" />
      ))}
    </Svg>
  )
}

function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null
  const diff = new Date(endDate).getTime() - Date.now()
  const d = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return d > 0 ? d : null
}

function tripDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1
}

function formatShort(n: number): string {
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
    queryKey: ['memberCounts', tripIds],
    queryFn: async () => {
      const { data } = await supabase
        .from('trip_members')
        .select('trip_id')
        .in('trip_id', tripIds)
      const mc: Record<string, number> = {}
      ;(data ?? []).forEach((m: any) => { mc[m.trip_id] = (mc[m.trip_id] ?? 0) + 1 })
      return mc
    },
    enabled: tripIds.length > 0,
  })

  const { data: totalSpent = {} } = useQuery({
    queryKey: ['totalSpent', tripIds],
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select('trip_id, amount_in_base')
        .in('trip_id', tripIds)
      const ts: Record<string, number> = {}
      ;(data ?? []).forEach((e: any) => { ts[e.trip_id] = (ts[e.trip_id] ?? 0) + (e.amount_in_base ?? 0) })
      return ts
    },
    enabled: tripIds.length > 0,
  })

  useEffect(() => {
    if (trips[0]) setActiveTripId(trips[0].id)
  }, [trips[0]?.id])

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? ''
  const avatarLetter = firstName[0]?.toUpperCase() ?? '?'
  const heroTrip = trips[0]
  const otherTrips = trips.slice(1)

  const heroMembers = heroTrip ? (memberCounts[heroTrip.id] ?? 1) : 0
  const heroDaysLeft = heroTrip ? daysLeft(heroTrip.end_date) : null
  const heroTotalDays = heroTrip ? tripDays(heroTrip.start_date, heroTrip.end_date) : null
  const heroSpent = heroTrip ? (totalSpent[heroTrip.id] ?? 0) : 0
  const heroBudgetPct = heroTrip?.budget && heroSpent > 0
    ? Math.min(heroSpent / heroTrip.budget, 1)
    : null

  function openTrip(trip: Trip) {
    setActiveTripId(trip.id)
    navigation.navigate('TripDetail', { tripId: trip.id, tripName: trip.name })
  }

  function goToExpenses(trip: Trip) {
    setActiveTripId(trip.id)
    navigation.navigate('Expenses')
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>{firstName ? `${firstName}'s Trips` : 'My Trips'}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: '#5B7FA6' }]}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.ocean} size="large" />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>Belum ada trip</Text>
          <Text style={styles.emptySub}>Tekan tombol di bawah untuk memulai petualangan</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {heroTrip && (
            <TouchableOpacity style={styles.heroWrap} onPress={() => openTrip(heroTrip)} activeOpacity={0.9}>
              <LinearGradient colors={TRIP_GRADIENTS[0] as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGrad}>
                <GridPattern />
                <LinearGradient
                  colors={['transparent', 'rgba(12,15,30,0.72)']}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill as any}
                />
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
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.sunsetSoft }]}>
                  <Icon name="receipt" size={14} color={colors.sunset} />
                </View>
                <Text style={styles.statVal} numberOfLines={1}>
                  {heroSpent > 0 ? formatShort(heroSpent) : '0'}
                </Text>
                <Text style={styles.statLbl}>{heroTrip.base_currency} spent</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.oceanSoft }]}>
                  <Icon name="calendar" size={14} color={colors.ocean} />
                </View>
                <Text style={styles.statVal}>{heroDaysLeft ?? (heroTotalDays ?? '—')}</Text>
                <Text style={styles.statLbl}>{heroDaysLeft ? 'Days left' : heroTotalDays ? 'Total days' : 'Days'}</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.forestSoft }]}>
                  <Icon name="users" size={14} color={colors.forest} />
                </View>
                <Text style={styles.statVal}>{heroMembers}</Text>
                <Text style={styles.statLbl}>Travelers</Text>
              </View>
            </View>
          )}

          {heroTrip && heroSpent > 0 && (
            <View>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Budget Overview</Text>
                <TouchableOpacity onPress={() => goToExpenses(heroTrip)}>
                  <Text style={styles.sectionLink}>Details →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.budgetCard}>
                <View style={styles.budgetTop}>
                  <View>
                    <Text style={styles.budgetSpent}>
                      {heroSpent.toLocaleString('id-ID')}
                      <Text style={styles.budgetSpentLabel}> spent</Text>
                    </Text>
                    {heroTrip.budget ? (
                      <Text style={styles.budgetTarget}>
                        of {heroTrip.budget.toLocaleString('id-ID')} budget
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.budgetSub}>{heroTrip.base_currency}</Text>
                </View>
                {heroBudgetPct !== null && (
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={heroBudgetPct > 0.9 ? [colors.sunset, '#E53935'] : [colors.ocean, colors.forest]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.barFill, { width: `${(heroBudgetPct * 100).toFixed(0)}%` as any }]}
                    />
                  </View>
                )}
                <View style={styles.budgetMeta}>
                  <Text style={styles.budgetMetaText}>{heroMembers} travelers</Text>
                  {heroBudgetPct !== null && (
                    <Text style={[styles.budgetMetaText, heroBudgetPct > 0.9 && { color: colors.sunset }]}>
                      {(heroBudgetPct * 100).toFixed(0)}% used
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {otherTrips.length > 0 && (
            <View>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Upcoming Trips</Text>
              </View>
              {otherTrips.map((trip, index) => {
                const g = TRIP_GRADIENTS[(index + 1) % TRIP_GRADIENTS.length]
                return (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.listItem}
                    onPress={() => openTrip(trip)}
                    activeOpacity={0.75}
                  >
                    <LinearGradient
                      colors={[g[0], g[1]] as any}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.listSwatch}
                    />
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTrip')}
        activeOpacity={0.85}
      >
        <Icon name="plus" size={16} color="white" />
        <Text style={styles.fabText}>Trip Baru</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  safeHeader: { backgroundColor: colors.night },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24,
    backgroundColor: colors.night,
  },
  greeting: {
    fontFamily: 'DMSans_500Medium', fontSize: 12,
    color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
    letterSpacing: 1.2, marginBottom: 3,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 28,
    color: colors.white, lineHeight: 30,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.white },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 26, color: colors.text },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },

  content: { padding: 18, gap: 18 },

  heroWrap: {
    height: 210, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 20, elevation: 10,
  },
  heroGrad: { flex: 1 },
  heroBody: { flex: 1, padding: 16, justifyContent: 'space-between' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  heroBadgeText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.white, letterSpacing: 0.6 },
  heroLoc: {
    fontFamily: 'DMSans_500Medium', fontSize: 12,
    color: 'rgba(180,215,240,0.85)', letterSpacing: 1.2, marginBottom: 4,
  },
  heroName: {
    fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 34,
    color: colors.white, lineHeight: 36, letterSpacing: -0.3,
  },
  heroDates: {
    fontFamily: 'DMSans_400Regular', fontSize: 12,
    color: 'rgba(180,200,230,0.8)', marginTop: 6,
  },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  statIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statVal: { fontFamily: 'DMSans_600SemiBold', fontSize: 20, color: colors.text, lineHeight: 22 },
  statLbl: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },

  sectionHead: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: colors.text },
  sectionLink: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.ocean },

  budgetCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  budgetSpent: { fontFamily: 'DMSans_600SemiBold', fontSize: 22, color: colors.text },
  budgetSpentLabel: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.muted },
  budgetTarget: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  budgetSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  barTrack: { height: 6, backgroundColor: colors.sand, borderRadius: 100, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 100 },
  budgetMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  budgetMetaText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted },

  listItem: {
    backgroundColor: colors.white, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  listSwatch: { width: 48, height: 48, borderRadius: 12, flexShrink: 0 },
  listInfo: { flex: 1 },
  listName: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.text },
  listDate: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },

  fab: {
    position: 'absolute', bottom: 22, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.sunset, borderRadius: 100,
    paddingVertical: 14, paddingHorizontal: 28,
    shadowColor: colors.sunset,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  fabText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.white },
})
