import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useCreateTrip } from '../../hooks/useTrips'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'
import AppInput from '../../components/ui/AppInput'
import DateInput from '../../components/ui/DateInput'

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD', 'GBP', 'THB']

function parseDateLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function CreateTripScreen({ navigation }: any) {
  const { profile } = useAuth()
  const createTrip = useCreateTrip()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('IDR')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim() || !destination.trim()) {
      setError('Trip name and destination are required.')
      return
    }
    if (!profile) return
    setError('')
    try {
      await createTrip.mutateAsync({
        name: name.trim(),
        destination: destination.trim(),
        base_currency: baseCurrency,
        budget: budget ? parseFloat(budget) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        created_by: profile.id,
      })
      navigation.goBack()
    } catch (e: any) {
      setError(e.message ?? 'Failed to create trip')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppInput label="Trip Name" value={name} onChangeText={setName} placeholder="e.g. Bali Trip 2025" />
      <AppInput label="Destination" value={destination} onChangeText={setDestination} placeholder="e.g. Bali, Indonesia" />
      <AppInput
        label="Budget (optional)"
        value={budget}
        onChangeText={setBudget}
        placeholder="e.g. 5000000"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Base Currency</Text>
      <View style={styles.currencyRow}>
        {CURRENCIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, baseCurrency === c && styles.chipActive]}
            onPress={() => setBaseCurrency(c)}
          >
            <Text style={[styles.chipText, baseCurrency === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <DateInput label="Start Date (optional)" value={startDate} onChange={setStartDate} />
      <DateInput
        label="End Date (optional)"
        value={endDate}
        onChange={setEndDate}
        minimumDate={startDate ? parseDateLocal(startDate) : undefined}
      />

      <AppButton label="Create Trip" onPress={handleCreate} loading={createTrip.isPending} style={styles.btn} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, gap: 12 },
  label: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: colors.text },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.night, borderColor: colors.ocean },
  chipText: { fontFamily: 'PlusJakartaSans_400Regular', color: colors.text, fontSize: 13 },
  chipTextActive: { color: colors.white },
  btn: { marginTop: 8 },
  error: { fontFamily: 'PlusJakartaSans_400Regular', color: colors.sunset, fontSize: 13 },
})
