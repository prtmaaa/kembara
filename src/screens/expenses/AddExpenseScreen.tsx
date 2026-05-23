import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch,
} from 'react-native'
import { useMembers } from '../../hooks/useMembers'
import { useCreateExpense } from '../../hooks/useExpenses'
import { useExchangeRate, getRateToBase } from '../../hooks/useExchangeRate'
import { useTrip } from '../../hooks/useTrip'
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
  const [currency, setCurrency] = useState('IDR')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState('')
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
    if (profile?.id && !paidBy) setPaidBy(profile.id)
  }, [profile?.id])

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    const shares: Record<string, string> = {}
    memberRows.forEach(m => { initial[m.user_id] = true; shares[m.user_id] = '' })
    setParticipants(initial)
    setCustomShares(shares)
  }, [memberRows.length])

  useEffect(() => {
    if (trip?.base_currency) setCurrency(trip.base_currency)
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
              <TouchableOpacity
                key={c}
                style={[styles.chip, currency === c && styles.chipActive]}
                onPress={() => setCurrency(c)}
              >
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
          <TouchableOpacity
            key={c}
            style={[styles.catChip, category === c && styles.catChipActive]}
            onPress={() => setCategory(c)}
          >
            <CategoryIcon category={c} size={28} />
            <Text style={[styles.catLabel, category === c && styles.catLabelActive]}>{CAT_LABELS[c]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <AppInput label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />

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
              {svcPct > 0 && (
                <Text style={styles.totalRow}>
                  Service ({svcPct}%): {(subtotal * svcPct / 100).toLocaleString()} {currency}
                </Text>
              )}
              {taxPctNum > 0 && (
                <Text style={styles.totalRow}>
                  Tax ({taxPctNum}%): {(subtotal * taxPctNum / 100).toLocaleString()} {currency}
                </Text>
              )}
              <Text style={styles.totalFinal}>Total: {totalAmount.toLocaleString()} {currency}</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.fieldLabel}>Paid by</Text>
      {memberRows.map((m) => {
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

      <AppButton
        label="Add Expense"
        onPress={handleSubmit}
        loading={createExpense.isPending}
        style={styles.btn}
      />
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
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 100,
    paddingVertical: 5, paddingHorizontal: 10, backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.night, borderColor: colors.night },
  chipText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.text },
  chipTextActive: { color: colors.white },
  rateInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.oceanSoft, borderRadius: 10, padding: 10,
  },
  rateText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.ocean },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    alignItems: 'center', gap: 4, padding: 8, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, minWidth: 72,
  },
  catChipActive: { borderColor: colors.ocean, backgroundColor: colors.oceanSoft },
  catLabel: { fontFamily: 'DMSans_500Medium', fontSize: 10, color: colors.muted },
  catLabelActive: { color: colors.ocean },
  chargesToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chargesToggleText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.ocean },
  chargesBox: { backgroundColor: colors.white, borderRadius: 16, padding: 14, gap: 12 },
  totalBreakdown: { gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  totalFinal: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.text },
  memberRow: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 12, backgroundColor: colors.white,
  },
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
