import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Switch, Alert,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors, radius } from '../../theme'
import { Profile, ExpenseCategory } from '../../types'

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD', 'GBP', 'THB']
const CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'accommodation', 'activity', 'shopping', 'other']

export default function EditExpenseScreen({ route, navigation }: any) {
  const { expenseId, tripId } = route.params
  const [members, setMembers] = useState<Profile[]>([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('IDR')
  const [exchangeRate, setExchangeRate] = useState('1')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [date, setDate] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: expense }, { data: memberData }] = await Promise.all([
      supabase
        .from('expenses')
        .select('*, participants:expense_participants(*)')
        .eq('id', expenseId)
        .single(),
      supabase
        .from('profiles')
        .select('*')
        .in('id', await getMemberIds()),
    ])

    if (expense) {
      setTitle(expense.title)
      setAmount(String(expense.amount))
      setCurrency(expense.currency)
      setExchangeRate(String(expense.exchange_rate))
      setCategory(expense.category)
      setDate(expense.date)
      setPaidBy(expense.paid_by)

      const profiles = memberData ?? []
      const participantIds = new Set((expense.participants ?? []).map((p: any) => p.user_id))
      setMembers(profiles)
      const initial: Record<string, boolean> = {}
      profiles.forEach((p: Profile) => {
        initial[p.id] = participantIds.has(p.id)
      })
      setSelectedParticipants(initial)
    }

    setLoading(false)
  }

  async function getMemberIds(): Promise<string[]> {
    const { data } = await supabase
      .from('trip_members')
      .select('user_id')
      .eq('trip_id', tripId)
    return data?.map((m: any) => m.user_id) ?? []
  }

  function toggleParticipant(userId: string) {
    setSelectedParticipants((prev) => ({ ...prev, [userId]: !prev[userId] }))
  }

  async function saveExpense() {
    if (submitting.current) return
    if (!title.trim() || !amount || !paidBy) {
      setError('Title, amount, dan pembayar harus diisi.')
      return
    }
    submitting.current = true
    setSaving(true)
    setError('')

    const amountNum = parseFloat(amount)
    const rateNum = parseFloat(exchangeRate) || 1
    const amountInBase = amountNum * rateNum

    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        paid_by: paidBy,
        title: title.trim(),
        amount: amountNum,
        currency,
        amount_in_base: amountInBase,
        exchange_rate: rateNum,
        category,
        date,
      })
      .eq('id', expenseId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      submitting.current = false
      return
    }

    const participants = Object.entries(selectedParticipants)
      .filter(([, selected]) => selected)
      .map(([userId]) => userId)

    const shareAmount = amountInBase / participants.length

    await supabase.from('expense_participants').delete().eq('expense_id', expenseId)
    await supabase.from('expense_participants').insert(
      participants.map((userId) => ({
        expense_id: expenseId,
        user_id: userId,
        share_amount: shareAmount,
      }))
    )

    setSaving(false)
    submitting.current = false
    navigation.goBack()
  }

  async function deleteExpense() {
    Alert.alert(
      'Hapus Expense',
      'Yakin mau hapus pengeluaran ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('expenses').delete().eq('id', expenseId)
            navigation.goBack()
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Currency</Text>
      <View style={styles.chipRow}>
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

      <Text style={styles.label}>Exchange Rate to Base</Text>
      <TextInput
        style={styles.input}
        value={exchangeRate}
        onChangeText={setExchangeRate}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
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
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
      />

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

      <TouchableOpacity style={styles.saveButton} onPress={saveExpense} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={deleteExpense}>
        <Text style={styles.deleteButtonText}>Hapus Expense</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.night, borderColor: colors.ocean },
  chipText: { color: colors.text, fontSize: 12 },
  chipTextActive: { color: '#fff' },
  memberRow: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 6 },
  memberRowActive: { borderColor: colors.ocean, backgroundColor: colors.oceanSoft },
  memberName: { fontSize: 14, color: colors.text },
  memberNameActive: { color: colors.ocean, fontWeight: '600' },
  participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  saveButton: { backgroundColor: colors.night, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  deleteButton: { borderWidth: 1, borderColor: '#ef4444', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12, marginBottom: 40 },
  deleteButtonText: { color: colors.sunset, fontWeight: '600', fontSize: 16 },
  error: { color: colors.sunset, marginBottom: 12, fontSize: 13 },
})
