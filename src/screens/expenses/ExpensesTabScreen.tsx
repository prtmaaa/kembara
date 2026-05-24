import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, Modal,
} from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { useExpenses } from '../../hooks/useExpenses'
import { useTrip } from '../../hooks/useTrip'
import { colors } from '../../theme'
import { useActiveTrip } from '../../context/ActiveTripContext'
import { useTrips } from '../../hooks/useTrips'
import Icon from '../../components/Icon'

type CatFilter = 'all' | 'accommodation' | 'food' | 'transport' | 'activity' | 'shopping' | 'other'

const CAT_LABELS: Record<CatFilter, string> = {
  all: 'All', accommodation: 'Stay', food: 'Food',
  transport: 'Transport', activity: 'Activity', shopping: 'Shopping', other: 'Other',
}

const CAT_ICON_MAP: Record<string, { icon: any; bg: string; color: string }> = {
  accommodation: { icon: 'bed',    bg: colors.oceanSoft,    color: colors.ocean },
  food:          { icon: 'fork',   bg: colors.sunsetSoft,   color: colors.sunset },
  transport:     { icon: 'car',    bg: colors.lavenderSoft, color: colors.lavender },
  activity:      { icon: 'camera', bg: colors.forestSoft,   color: colors.forest },
  shopping:      { icon: 'bag',    bg: colors.sand,         color: colors.muted },
  other:         { icon: 'pin',    bg: colors.sand,         color: colors.muted },
}

function DonutRing({ pct }: { pct: number }) {
  const r = 32
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <View style={styles.ringWrap}>
      <Svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx="40" cy="40" r={r} fill="none" stroke="#2A2E45" strokeWidth="6" />
        <Circle
          cx="40" cy="40" r={r} fill="none"
          stroke={colors.sunset} strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringPct}>{Math.round(pct)}%</Text>
        <Text style={styles.ringLbl}>used</Text>
      </View>
    </View>
  )
}

export default function ExpensesTabScreen({ navigation, route }: any) {
  const { activeTripId, setActiveTripId } = useActiveTrip()
  const { data: trips = [] } = useTrips()
  const paramTripId = route?.params?.tripId
  const tripId = paramTripId ?? activeTripId ?? trips[0]?.id

  const [filter, setFilter] = useState<CatFilter>('all')
  const [showPicker, setShowPicker] = useState(false)

  const { data: trip, isLoading: tripLoading } = useTrip(tripId ?? '')
  const { data: expenses = [], isLoading: expLoading } = useExpenses(tripId ?? '')
  const loading = tripLoading || expLoading

  const total = expenses.reduce((s, e) => s + e.amount_in_base, 0)
  const budget = trip?.budget ?? null
  const pct = budget && total > 0 ? Math.min((total / budget) * 100, 100) : (expenses.length > 0 ? 65 : 0)
  const remaining = budget ? Math.max(budget - total, 0) : null
  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter)
  const cats: CatFilter[] = ['all', 'accommodation', 'food', 'transport', 'activity', 'shopping', 'other']

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.ocean} size="large" />
      </View>
    )
  }

  if (!tripId || !trip) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.screenHeader}>
            <Text style={styles.h1}>Expenses</Text>
          </View>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySub}>Create a trip from the Home tab first</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Dark extended header */}
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.screenHeader}>
          <Text style={styles.h1}>Expenses</Text>
          <TouchableOpacity style={styles.tripPicker} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
            <Text style={styles.sub}>{trip.name}</Text>
            <Icon name="chevronR" size={12} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerExt}>
          {/* Budget ring area */}
          <View style={styles.ringArea}>
            <DonutRing pct={pct} />
            <View style={styles.ringInfo}>
              <Text style={styles.ringTotal}>
                {total.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.ringSubText}>{trip.base_currency} total spent</Text>
              {remaining !== null ? (
                <Text style={styles.ringRemaining}>↑ {remaining.toLocaleString('id-ID')} remaining</Text>
              ) : (
                <Text style={styles.ringRemaining}>↑ {expenses.length} transactions</Text>
              )}
            </View>
          </View>

          {/* Category filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catFilterContent}
            style={styles.catFilter}
          >
            {cats.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.pill, filter === c ? styles.pillActive : styles.pillInactive]}
                onPress={() => setFilter(c)}
              >
                <Text style={[styles.pillText, filter === c ? styles.pillTextActive : styles.pillTextInactive]}>
                  {CAT_LABELS[c]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Expense list */}
      <ScrollView contentContainerStyle={styles.expList} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.expEmpty}>
            <Text style={styles.expEmptyText}>No expenses yet</Text>
          </View>
        ) : (
          filtered.map(exp => {
            const cat = CAT_ICON_MAP[exp.category] ?? CAT_ICON_MAP.other
            const paidByName = (exp.paid_by_profile as any)?.full_name ?? (exp.paid_by_profile as any)?.email ?? '?'
            return (
              <TouchableOpacity
                key={exp.id}
                style={styles.expItem}
                onPress={() => navigation.navigate('EditExpense', { expenseId: exp.id, tripId: trip.id })}
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
                  <Text style={styles.expAmt}>{exp.amount.toLocaleString('id-ID')}</Text>
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
        style={styles.fab} testID="fab-add-expense"
        onPress={() => navigation.navigate('AddExpense', { tripId: trip.id, tripName: trip.name })}
        activeOpacity={0.85}
      >
        <Icon name="plus" size={16} color="white" />
        <Text style={styles.fabText}>Add Expense</Text>
      </TouchableOpacity>

      {/* Trip picker modal */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Switch Trip</Text>
            {trips.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.tripRow}
                onPress={() => { setActiveTripId(t.id); setShowPicker(false) }}
              >
                <View style={styles.tripRowInfo}>
                  <Text style={styles.tripRowName}>{t.name}</Text>
                  <Text style={styles.tripRowDest}>{t.destination}</Text>
                </View>
                {t.id === tripId && <Icon name="check" size={16} color={colors.ocean} />}
              </TouchableOpacity>
            ))}
            <View style={{ height: 20 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },

  safeHeader: { backgroundColor: colors.night },
  screenHeader: {
    backgroundColor: colors.night,
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 0,
  },
  h1: { fontFamily: 'Fraunces_700Bold', fontSize: 32, color: colors.white, lineHeight: 36 },
  sub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  tripPicker: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: colors.text, marginBottom: 12 },
  tripRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  tripRowInfo: { flex: 1 },
  tripRowName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: colors.text },
  tripRowDest: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },

  headerExt: {
    backgroundColor: colors.night,
    paddingHorizontal: 22, paddingBottom: 20, paddingTop: 16,
  },
  ringArea: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16 },
  ringWrap: { width: 80, height: 80, position: 'relative', flexShrink: 0 },
  ringCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  ringPct: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: colors.white, lineHeight: 18 },
  ringLbl: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 9, color: '#5A6070', marginTop: 1 },
  ringInfo: { flex: 1 },
  ringTotal: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, color: colors.white },
  ringSubText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#5A6070', marginTop: 2 },
  ringRemaining: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: '#3DAB72', marginTop: 4 },

  catFilter: {},
  catFilterContent: { gap: 8, paddingBottom: 2 },
  pill: { borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  pillActive: { backgroundColor: colors.white },
  pillInactive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  pillText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  pillTextActive: { color: colors.night },
  pillTextInactive: { color: 'rgba(255,255,255,0.6)' },

  expList: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  expEmpty: { alignItems: 'center', paddingTop: 60 },
  expEmptyText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.muted },

  expItem: {
    backgroundColor: colors.white, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  expCatIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  expInfo: { flex: 1, minWidth: 0 },
  expName: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: colors.text },
  expMeta: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
  expAmtCol: { alignItems: 'flex-end' },
  expAmt: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: colors.text },
  expPaid: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: colors.text },
  emptySub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 6 },

  fab: {
    position: 'absolute', bottom: 22, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.sunset, borderRadius: 100,
    paddingVertical: 14, paddingHorizontal: 28,
    shadowColor: colors.sunset,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  fabText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: colors.white },
})
