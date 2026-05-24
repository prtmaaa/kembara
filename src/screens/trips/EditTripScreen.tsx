import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native'
import { useTrip } from '../../hooks/useTrip'
import { useUpdateTrip } from '../../hooks/useTrips'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'
import AppInput from '../../components/ui/AppInput'
import DateInput from '../../components/ui/DateInput'

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD', 'GBP', 'THB']

function parseDateLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function EditTripScreen({ route, navigation }: any) {
  const { tripId } = route.params
  const { data: trip, isLoading } = useTrip(tripId)
  const updateTrip = useUpdateTrip()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('IDR')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (trip) {
      setName(trip.name)
      setDestination(trip.destination)
      setBaseCurrency(trip.base_currency)
      setStartDate(trip.start_date ?? '')
      setEndDate(trip.end_date ?? '')
      setBudget(trip.budget ? String(trip.budget) : '')
    }
  }, [trip?.id])

  async function handleSave() {
    if (!name.trim() || !destination.trim()) {
      setError('Trip name and destination are required.')
      return
    }
    setError('')
    try {
      await updateTrip.mutateAsync({
        id: tripId,
        name: name.trim(),
        destination: destination.trim(),
        base_currency: baseCurrency,
        start_date: startDate || null,
        end_date: endDate || null,
        budget: budget ? parseFloat(budget) : null,
      })
      navigation.goBack()
    } catch (e: any) {
      setError(e.message ?? 'Failed to save trip')
    }
  }

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator color={colors.ocean} size="large" /></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppInput label="Trip Name" value={name} onChangeText={setName} />
      <AppInput label="Destination" value={destination} onChangeText={setDestination} />
      <AppInput
        label="Budget (optional)"
        value={budget}
        onChangeText={setBudget}
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

      <AppButton label="Save Changes" onPress={handleSave} loading={updateTrip.isPending} style={styles.btn} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, gap: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.night, borderColor: colors.ocean },
  chipText: { fontFamily: 'DMSans_400Regular', color: colors.text, fontSize: 13 },
  chipTextActive: { color: colors.white },
  btn: { marginTop: 8, marginBottom: 40 },
  error: { fontFamily: 'DMSans_400Regular', color: colors.sunset, fontSize: 13 },
})
