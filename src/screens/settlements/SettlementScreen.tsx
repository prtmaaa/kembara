import React, { useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native'
import { useExpenses } from '../../hooks/useExpenses'
import { useMembers } from '../../hooks/useMembers'
import { useSettlements, useCreateSettlement } from '../../hooks/useSettlements'
import { useTrip } from '../../hooks/useTrip'
import { calculateDebts } from '../../utils/debtCalculator'
import { Profile } from '../../types'
import { colors } from '../../theme'
import AvatarInitials from '../../components/ui/AvatarInitials'
import Icon from '../../components/Icon'

export default function SettlementScreen({ route, navigation }: any) {
  const { tripId } = route.params
  const { data: trip } = useTrip(tripId)
  const { data: expenses = [] } = useExpenses(tripId)
  const { data: memberRows = [] } = useMembers(tripId)
  const { data: settlements = [] } = useSettlements(tripId)
  const createSettlement = useCreateSettlement()

  const members = memberRows.map(m => m.profile).filter(Boolean) as Profile[]
  const baseCurrency = trip?.base_currency ?? 'IDR'

  const debts = useMemo(
    () => calculateDebts(expenses, members, baseCurrency),
    [expenses, members, baseCurrency]
  )

  function confirmSettle(fromId: string, toId: string, amount: number, fromName: string, toName: string) {
    Alert.alert(
      'Mark as Settled',
      `Confirm that ${fromName} paid ${toName} ${amount.toLocaleString()} ${baseCurrency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => createSettlement.mutate({
            trip_id: tripId,
            from_user_id: fromId,
            to_user_id: toId,
            amount,
            currency: baseCurrency,
          }),
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="chevronL" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.h1}>Settle Up</Text>
          <Text style={styles.sub}>{trip?.name}</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending</Text>
          {debts.length === 0 ? (
            <View style={styles.allClear}>
              <Icon name="heart" size={24} color={colors.forest} />
              <Text style={styles.allClearTitle}>All settled up!</Text>
              <Text style={styles.allClearSub}>No outstanding debts for this trip</Text>
            </View>
          ) : (
            debts.map((debt, i) => {
              const fromName = debt.from.full_name ?? debt.from.email
              const toName = debt.to.full_name ?? debt.to.email
              return (
                <View key={i} style={styles.debtCard}>
                  <View style={styles.debtParties}>
                    <View style={styles.debtPerson}>
                      <AvatarInitials name={fromName} index={i * 2} size={40} />
                      <Text style={styles.debtName} numberOfLines={1}>{fromName.split(' ')[0]}</Text>
                    </View>
                    <View style={styles.debtArrow}>
                      <Text style={styles.debtAmount}>{debt.amount.toLocaleString()}</Text>
                      <Text style={styles.debtCurrency}>{baseCurrency}</Text>
                      <Icon name="chevronR" size={14} color={colors.muted} />
                    </View>
                    <View style={styles.debtPerson}>
                      <AvatarInitials name={toName} index={i * 2 + 1} size={40} />
                      <Text style={styles.debtName} numberOfLines={1}>{toName.split(' ')[0]}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.settleBtn}
                    onPress={() => confirmSettle(
                      debt.from.id, debt.to.id, debt.amount,
                      fromName.split(' ')[0], toName.split(' ')[0]
                    )}
                    disabled={createSettlement.isPending}
                  >
                    <Text style={styles.settleBtnText}>Mark as Settled</Text>
                  </TouchableOpacity>
                </View>
              )
            })
          )}
        </View>

        {settlements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>History</Text>
            {settlements.map((s) => {
              const fromName = (s.from_profile as any)?.full_name ?? (s.from_profile as any)?.email ?? 'Unknown'
              const toName = (s.to_profile as any)?.full_name ?? (s.to_profile as any)?.email ?? 'Unknown'
              const date = new Date(s.settled_at).toLocaleDateString()
              return (
                <View key={s.id} style={styles.historyRow}>
                  <View style={styles.historyIcon}>
                    <Icon name="check" size={14} color={colors.forest} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyText}>
                      <Text style={styles.historyName}>{fromName.split(' ')[0]}</Text>
                      <Text style={{ color: colors.muted }}> paid </Text>
                      <Text style={styles.historyName}>{toName.split(' ')[0]}</Text>
                    </Text>
                    <Text style={styles.historyDate}>{date}</Text>
                  </View>
                  <Text style={styles.historyAmt}>{s.amount.toLocaleString()} {s.currency}</Text>
                </View>
              )
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  safeHeader: { backgroundColor: colors.night },
  header: { backgroundColor: colors.night, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20 },
  backBtn: { marginBottom: 8, alignSelf: 'flex-start' },
  h1: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 32, color: colors.white },
  sub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  content: { padding: 18, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: colors.text },
  allClear: {
    backgroundColor: colors.forestSoft, borderRadius: 16,
    padding: 24, alignItems: 'center', gap: 8,
  },
  allClearTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: colors.forest },
  allClearSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.forest },
  debtCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  debtParties: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  debtPerson: { alignItems: 'center', gap: 6, flex: 1 },
  debtName: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.text, textAlign: 'center' },
  debtArrow: { alignItems: 'center', gap: 2, flex: 1 },
  debtAmount: { fontFamily: 'DMSans_600SemiBold', fontSize: 18, color: colors.text },
  debtCurrency: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted },
  settleBtn: {
    backgroundColor: colors.sunsetSoft, borderRadius: 100,
    paddingVertical: 10, alignItems: 'center',
  },
  settleBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.sunset },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  historyIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.forestSoft,
    justifyContent: 'center', alignItems: 'center',
  },
  historyInfo: { flex: 1 },
  historyText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.text },
  historyName: { fontFamily: 'DMSans_600SemiBold' },
  historyDate: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
  historyAmt: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.forest },
})
