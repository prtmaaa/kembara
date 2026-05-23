import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Line } from 'react-native-svg'
import { useTrip } from '../../hooks/useTrip'
import { useExpenses } from '../../hooks/useExpenses'
import { useMembers } from '../../hooks/useMembers'
import { useAuth } from '../../hooks/useAuth'
import { Profile } from '../../types'
import { calculateDebts } from '../../utils/debtCalculator'
import { colors } from '../../theme'
import Icon from '../../components/Icon'

const HERO_COLORS: [string, string, string] = ['#1D4D7A', '#1D5E5A', '#206640']
const AVATAR_COLORS = ['#5B7FA6', '#C4784C', '#6A9A7A', '#8B7AC8']

const CAT_ICON_MAP: Record<string, { icon: any; bg: string; color: string }> = {
  accommodation: { icon: 'bed',    bg: colors.oceanSoft,    color: colors.ocean },
  food:          { icon: 'fork',   bg: colors.sunsetSoft,   color: colors.sunset },
  transport:     { icon: 'car',    bg: colors.lavenderSoft, color: colors.lavender },
  activity:      { icon: 'camera', bg: colors.forestSoft,   color: colors.forest },
  shopping:      { icon: 'bag',    bg: colors.sand,         color: colors.muted },
  other:         { icon: 'pin',    bg: colors.sand,         color: colors.muted },
}

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

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatShort(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toFixed(0)
}

export default function TripDetailScreen({ route, navigation }: any) {
  const { tripId } = route.params
  const { profile } = useAuth()
  const { data: trip, isLoading: tripLoading } = useTrip(tripId)
  const { data: expenses = [], isLoading: expLoading } = useExpenses(tripId)
  const { data: memberRows = [] } = useMembers(tripId)
  const members = memberRows.map(m => m.profile).filter(Boolean) as Profile[]
  const isLoading = tripLoading || expLoading
  const isOwner = trip?.created_by === profile?.id

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator color={colors.ocean} size="large" /></View>
  }

  const baseCurrency = trip?.base_currency ?? ''
  const totalInBase = expenses.reduce((s, e) => s + e.amount_in_base, 0)
  const budget = trip?.budget ?? null
  const budgetPct = budget && totalInBase > 0 ? Math.min(totalInBase / budget, 1) : null
  const debts = calculateDebts(expenses, members, baseCurrency)

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.heroWrap}>
          <LinearGradient colors={HERO_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGrad}>
            <GridPattern />
            <LinearGradient
              colors={['transparent', 'rgba(12,15,30,0.72)']}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill as any}
            />
            <View style={styles.heroBody}>
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
              <View>
                <Text style={styles.heroLoc} numberOfLines={1}>{trip?.destination.toUpperCase()}</Text>
                <Text style={styles.heroName} numberOfLines={2}>{trip?.name}</Text>
                {trip?.start_date ? (
                  <Text style={styles.heroDates}>{trip.start_date} – {trip.end_date ?? '...'}</Text>
                ) : null}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.sunsetSoft }]}>
              <Icon name="receipt" size={14} color={colors.sunset} />
            </View>
            <Text style={styles.statVal}>{expenses.length}</Text>
            <Text style={styles.statLbl}>Transactions</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.oceanSoft }]}>
              <Icon name="users" size={14} color={colors.ocean} />
            </View>
            <Text style={styles.statVal}>{members.length}</Text>
            <Text style={styles.statLbl}>Members</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.forestSoft }]}>
              <Icon name="receipt" size={14} color={colors.forest} />
            </View>
            <Text style={styles.statVal} numberOfLines={1}>
              {totalInBase > 0 ? formatShort(totalInBase) : '0'}
            </Text>
            <Text style={styles.statLbl}>{baseCurrency}</Text>
          </View>
        </View>

        {/* Budget bar */}
        {totalInBase > 0 && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetAmt}>
                {totalInBase.toLocaleString()}
                <Text style={styles.budgetCur}> {baseCurrency}</Text>
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

        {/* Settlements */}
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

        {debts.length === 0 && expenses.length > 0 && (
          <View style={styles.allClear}>
            <Text style={styles.allClearText}>✅ All settled up!</Text>
          </View>
        )}

        {/* Members */}
        <TouchableOpacity
          style={styles.memberRow}
          onPress={() => navigation.navigate('InviteMember', { tripId, tripName: trip?.name })}
        >
          <View style={styles.memberAvatars}>
            {members.slice(0, 5).map((m, i) => (
              <View key={m.id} style={[styles.memberAvatar, { backgroundColor: AVATAR_COLORS[i % 4], marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i }]}>
                <Text style={styles.memberAvatarText}>{initials(m.full_name ?? m.email)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.memberText}>{members.length} members · Invite more</Text>
          <Icon name="chevronR" size={16} color={colors.border} />
        </TouchableOpacity>

        {/* Expenses list */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{expenses.length}</Text>
          </View>
        </View>

        {expenses.length === 0 ? (
          <View style={styles.expEmpty}>
            <Text style={styles.expEmptyEmoji}>🧾</Text>
            <Text style={styles.expEmptyTitle}>No expenses yet</Text>
            <Text style={styles.expEmptySub}>Tap the button below to add one</Text>
          </View>
        ) : (
          expenses.map((exp) => {
            const cat = CAT_ICON_MAP[exp.category] ?? CAT_ICON_MAP.other
            const paidByName = (exp.paid_by_profile as any)?.full_name ?? (exp.paid_by_profile as any)?.email ?? '?'
            return (
              <TouchableOpacity
                key={exp.id}
                style={styles.expItem}
                onPress={() => navigation.navigate('EditExpense', { expenseId: exp.id, tripId })}
                activeOpacity={0.75}
              >
                <View style={[styles.expCatIcon, { backgroundColor: cat.bg }]}>
                  <Icon name={cat.icon} size={18} color={cat.color} />
                </View>
                <View style={styles.expInfo}>
                  <Text style={styles.expName} numberOfLines={1}>{exp.title}</Text>
                  <Text style={styles.expMeta}>{exp.date}</Text>
                </View>
                <View style={styles.expAmtCol}>
                  <Text style={styles.expAmt}>{exp.amount.toLocaleString()}</Text>
                  <Text style={styles.expPaid}>by {paidByName.split(' ')[0]}</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense', { tripId, tripName: trip?.name })}
        activeOpacity={0.85}
      >
        <Icon name="plus" size={16} color="white" />
        <Text style={styles.fabText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { gap: 12 },
  heroWrap: { height: 210, overflow: 'hidden' },
  heroGrad: { flex: 1 },
  heroBody: { flex: 1, padding: 18, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  heroBadgeText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.white, letterSpacing: 0.6 },
  heroActions: { flexDirection: 'row', gap: 8 },
  heroActionBtn: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  heroActionBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.white },
  heroLoc: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: 'rgba(180,215,240,0.85)', letterSpacing: 1.2, marginBottom: 4 },
  heroName: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 34, color: colors.white, lineHeight: 36, letterSpacing: -0.3 },
  heroDates: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(180,200,230,0.8)', marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  statIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statVal: { fontFamily: 'DMSans_600SemiBold', fontSize: 20, color: colors.text, lineHeight: 22 },
  statLbl: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
  budgetCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  budgetAmt: { fontFamily: 'DMSans_600SemiBold', fontSize: 22, color: colors.text },
  budgetCur: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted },
  budgetLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  barTrack: { height: 6, backgroundColor: colors.sand, borderRadius: 100, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 100 },
  budgetMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  budgetMetaText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted },
  debtCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  debtTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.text },
  settleBtn: { backgroundColor: colors.sunsetSoft, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  settleBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.sunset },
  debtRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  debtAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  debtAvatarText: { fontFamily: 'DMSans_600SemiBold', fontSize: 10, color: colors.white },
  debtText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.text },
  debtName: { fontFamily: 'DMSans_600SemiBold', color: colors.text },
  debtAmt: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.sunset },
  debtMore: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.ocean, marginTop: 8, textAlign: 'center' },
  allClear: { backgroundColor: colors.forestSoft, borderRadius: 16, padding: 14, marginHorizontal: 16, alignItems: 'center' },
  allClearText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.forest },
  memberRow: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  memberAvatars: { flexDirection: 'row' },
  memberAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.white },
  memberAvatarText: { fontFamily: 'DMSans_600SemiBold', fontSize: 10, color: colors.white },
  memberText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 4 },
  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: colors.text },
  sectionBadge: { backgroundColor: colors.sand, borderRadius: 100, paddingVertical: 2, paddingHorizontal: 8 },
  sectionBadgeText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.muted },
  expEmpty: { alignItems: 'center', paddingVertical: 40, marginHorizontal: 16 },
  expEmptyEmoji: { fontSize: 40, marginBottom: 10 },
  expEmptyTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: colors.text },
  expEmptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' },
  expItem: { backgroundColor: colors.white, borderRadius: 16, marginHorizontal: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  expCatIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  expInfo: { flex: 1, minWidth: 0 },
  expName: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text },
  expMeta: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
  expAmtCol: { alignItems: 'flex-end' },
  expAmt: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: colors.text },
  expPaid: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
  fab: { position: 'absolute', bottom: 22, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.sunset, borderRadius: 100, paddingVertical: 14, paddingHorizontal: 28, shadowColor: colors.sunset, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8 },
  fabText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.white },
})
