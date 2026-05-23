import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Switch,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors, radius } from '../../theme'
import { Profile, ExpenseCategory } from '../../types'

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD', 'GBP', 'THB']
const CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'accommodation', 'activity', 'shopping', 'other']

export default function AddExpenseScreen({ route, navigation }: any) {
  const { tripId } = route.params
  const [members, setMembers] = useState<Profile[]>([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('IDR')
  const [exchangeRate, setExchangeRate] = useState('1')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, boolean>>({})
  const [splitEvenly, setSplitEvenly] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    const { data } = await supabase
      .from('trip_members')
      .select('*, profile:profiles(*)')
      .eq('trip_id', tripId)
    const profiles = data?.map((m: any) => m.profile).filter(Boolean) ?? []
    setMembers(profiles)
    const initial: Record<string, boolean> = {}
    profiles.forEach((p: Profile) => (initial[p.id] = true))
    setSelectedParticipants(initial)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setPaidBy(user.id)
  }

  function toggleParticipant(userId: string) {
    setSelectedParticipants((prev) => ({ ...prev, [userId]: !prev[userId] }))
  }

  async function addExpense() {
    if (!title.trim() || !amount || !paidBy) {
      setError('Title, amount, and payer are required.')
      return
    }
    setLoading(true)
    setError('')

    const amountNum = parseFloat(amount)
    const rateNum = parseFloat(exchangeRate) || 1
    const amountInBase = amountNum * rateNum

    const { data: expense, error: expError } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        paid_by: paidBy,
        title: title.trim(),
        amount: amountNum,
        currency,
        amount_in_base: amountInBase,
        exchange_rate: rateNum,
        category,
        date,
      })
      .select()
      .single()

    if (expError) { setError(expError.message); setLoading(false); return }

    const participants = Object.entries(selectedParticipants)
      .filter(([, selected]) => selected)
      .map(([userId]) => userId)

    const shareAmount = splitEvenly ? amountInBase / participants.length : amountInBase / participants.length

    await supabase.from('expense_participants').insert(
      participants.map((userId) => ({
        expense_id: expense.id,
        user_id: userId,
        share_amount: shareAmount,
      }))
    )

    setLoading(false)
    navigation.goBack()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} placeholder="e.g. Dinner at Jimbaran" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Amount</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <View style={styles.currencyRow}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, currency === c && styles.chipActive]}
              onPress={() => setCurrency(c)}
            >
              <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.label}>Exchange Rate to Base</Text>
      <TextInput
        style={styles.input}
        placeholder="1"
        value={exchangeRate}
        onChangeText={setExchangeRate}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.currencyRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Date</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />

      <Text style={styles.label}>Paid By</Text>
      {members.map((m) => (
        <TouchableOpacity
          key={m.id}
          style={[styles.memberRow, paidBy === m.id && styles.memberRowActive]}
          onPress={() => setPaidBy(m.id)}
        >
          <Text style={[styles.memberName, paidBy === m.id && styles.memberNameActive]}>
            {m.full_name ?? m.email}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Split Between</Text>
      {members.map((m) => (
        <View key={m.id} style={styles.participantRow}>
          <Text style={styles.memberName}>{m.full_name ?? m.email}</Text>
          <Switch
            value={selectedParticipants[m.id] ?? false}
            onValueChange={() => toggleParticipant(m.id)}
            trackColor={{ true: colors.ocean }}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={addExpense} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Expense</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 15 },
  row: { gap: 8 },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.night, borderColor: colors.ocean },
  chipText: { color: colors.text, fontSize: 12 },
  chipTextActive: { color: '#fff' },
  memberRow: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 6 },
  memberRowActive: { borderColor: colors.ocean, backgroundColor: colors.oceanSoft },
  memberName: { fontSize: 14, color: colors.text },
  memberNameActive: { color: colors.ocean, fontWeight: '600' },
  participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  button: { backgroundColor: colors.night, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: colors.sunset, marginBottom: 12, fontSize: 13 },
})
