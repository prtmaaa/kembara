import React, { useRef, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, ActivityIndicator, SafeAreaView,
} from 'react-native'
import Icon from '../../components/Icon'
import ViewShot, { captureRef } from 'react-native-view-shot'
import { LinearGradient } from 'expo-linear-gradient'
import { useExpenses } from '../../hooks/useExpenses'
import { useMembers } from '../../hooks/useMembers'
import { useSettlements } from '../../hooks/useSettlements'
import { useTrip } from '../../hooks/useTrip'
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

  if (!trip) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.ocean} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="chevronL" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.h1}>Export</Text>
          <Text style={styles.sub}>{trip.name}</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ViewShot ref={cardRef} options={{ format: 'png', quality: 0.95 }}>
          <View style={styles.card}>
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

            <View style={styles.cardSection}>
              <Text style={styles.cardSectionLabel}>TOTAL SPENT</Text>
              <Text style={styles.cardTotal}>{totalSpent.toLocaleString()} {baseCurrency}</Text>
              <Text style={styles.cardMeta}>{expenses.length} expenses · {members.length} travelers</Text>
            </View>

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
                        <View style={[styles.catBar, { width: `${Math.round(pct)}%` as any, backgroundColor: iconColor }]} />
                      </View>
                      <Text style={styles.catAmt}>{Math.round(pct)}%</Text>
                    </View>
                  )
                })}
              </View>
            )}

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

            {debts.length > 0 ? (
              <View style={[styles.cardSection, styles.cardSectionLast]}>
                <Text style={styles.cardSectionLabel}>SETTLEMENTS</Text>
                {debts.map((d, i) => (
                  <View key={i} style={styles.debtRow}>
                    <Text style={styles.debtFrom}>{d.from.full_name?.split(' ')[0] ?? d.from.email}</Text>
                    <Text style={styles.debtArrow}> owes </Text>
                    <Text style={styles.debtTo}>{d.to.full_name?.split(' ')[0] ?? d.to.email}</Text>
                    <Text style={styles.debtAmt}>{d.amount.toLocaleString()} {baseCurrency}</Text>
                  </View>
                ))}
              </View>
            ) : (
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
  backBtn: { marginBottom: 8, alignSelf: 'flex-start' },
  h1: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: colors.white },
  sub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  scroll: { padding: 18, gap: 18 },

  card: {
    backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  cardHeader: { padding: 24, gap: 4 },
  cardBrand: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
  cardTripName: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, color: colors.white, lineHeight: 30 },
  cardDest: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  cardDates: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  cardSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  cardSectionLast: { borderBottomWidth: 0 },
  cardSectionLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, color: colors.muted,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },

  cardTotal: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 28, color: colors.text },
  cardMeta: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.muted },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catName: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: colors.text, width: 80 },
  catBarWrap: { flex: 1, height: 4, backgroundColor: colors.sand, borderRadius: 100 },
  catBar: { height: '100%' as any, borderRadius: 100 },
  catAmt: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: colors.muted, width: 36, textAlign: 'right' },

  memberRow: { flexDirection: 'row', justifyContent: 'space-between' },
  memberName: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: colors.text },
  memberPaid: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: colors.text },

  debtRow: { flexDirection: 'row', alignItems: 'center' },
  debtFrom: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: colors.text },
  debtArrow: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.muted },
  debtTo: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: colors.text, flex: 1 },
  debtAmt: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: colors.sunset },

  allClearSection: { alignItems: 'center' },
  allClearText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: colors.forest },

  shareBtn: {
    backgroundColor: colors.sunset, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.sunset, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  shareBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: colors.white },
})
