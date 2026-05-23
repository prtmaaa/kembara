import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert, ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useMembers } from '../../hooks/useMembers'
import { useUpdateExpense, useDeleteExpense } from '../../hooks/useExpenses'
import { useExchangeRate, getRateToBase } from '../../hooks/useExchangeRate'
import { useTrip } from '../../hooks/useTrip'
import { Expense, ExpenseCategory } from '../../types'
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

export default function EditExpenseScreen({ route, navigation }: any) {
  const { expenseId, tripId } = route.params
  const { data: trip } = useTrip(tripId)
  const { data: memberRows = [] } = useMembers(tripId)
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const { data: expense, isLoading } = useQuery({
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

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('IDR')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [date, setDate] = useState('')
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
    if (!expense) return
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
  }, [expense])

  useEffect(() => {
    if (memberRows.length > 0 && Object.keys(customShares).length === 0) {
      const shares: Record<string, string> = {}
      memberRows.forEach(m => { shares[m.user_id] = '' })
      setCustomShares(shares)
    }
  }, [memberRows.length])

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
      await updateExpense.mutateAsync({
        expenseId,
        tripId,
        updates: {
          title: title.trim(),
          amount: totalAmount,
          currency,
          amount_in_base: amountInBase,
          exchange_rate: autoRate,
          service_charge_pct: svcPct,
          tax_pct: taxPctNum,
          category,
          date,
          paid_by: paidBy,
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

  function handleDelete() {
    Alert.alert('Delete Expense', 'Delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteExpense.mutateAsync({ expenseId, tripId })
          navigation.goBack()
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.ocean} size="large" />
      </View>
    )
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
        label="Save Changes"
        onPress={handleSubmit}
        loading={updateExpense.isPending}
        style={styles.btn}
      />
      <AppButton
        label="Delete Expense"
        variant="danger"
        onPress={handleDelete}
        loading={deleteExpense.isPending}
        style={{ marginTop: 8 }}
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
