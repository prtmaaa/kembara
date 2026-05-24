import React, { useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useActiveTrip } from '../../context/ActiveTripContext'
import { useTrips } from '../../hooks/useTrips'
import { useTrip } from '../../hooks/useTrip'
import { useAuth } from '../../hooks/useAuth'
import { useItineraryItems, useCreateItineraryItem, useDeleteItineraryItem, ItineraryItem } from '../../hooks/useItinerary'
import { colors } from '../../theme'
import Icon from '../../components/Icon'
import AppButton from '../../components/ui/AppButton'
import DateInput from '../../components/ui/DateInput'

type ItemType = 'transport' | 'stay' | 'food' | 'activity'

const TL_COLORS: Record<ItemType, { bg: string; color: string; dot: string }> = {
  transport: { bg: colors.lavenderSoft, color: colors.lavender, dot: colors.lavender },
  stay:      { bg: colors.oceanSoft,    color: colors.ocean,    dot: colors.ocean },
  food:      { bg: colors.sunsetSoft,   color: colors.sunset,   dot: colors.sunset },
  activity:  { bg: colors.forestSoft,   color: colors.forest,   dot: colors.forest },
}

const TYPE_LABELS: Record<ItemType, string> = {
  transport: 'Transport', stay: 'Stay', food: 'Food', activity: 'Activity',
}

function formatDayLabel(dateStr: string, index: number): { num: string; lbl: string } {
  const [, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return { num: String(index + 1), lbl: `${parseInt(d)} ${months[parseInt(m) - 1]}` }
}

export default function ItineraryScreen() {
  const { activeTripId } = useActiveTrip()
  const { data: trips = [] } = useTrips()
  const tripId = activeTripId ?? trips[0]?.id ?? ''

  const { data: trip } = useTrip(tripId)
  const { data: items = [], isLoading } = useItineraryItems(tripId)
  const createItem = useCreateItineraryItem()
  const deleteItem = useDeleteItineraryItem()
  const { profile } = useAuth()

  const [activeDay, setActiveDay] = useState(0)
  const [showAdd, setShowAdd] = useState(false)

  const [form, setForm] = useState({
    title: '', type: 'activity' as ItemType,
    date: new Date().toISOString().slice(0, 10),
    time: '', notes: '',
  })

  const dayMap = useMemo(() => {
    const map: Record<string, ItineraryItem[]> = {}
    items.forEach(item => {
      if (!map[item.date]) map[item.date] = []
      map[item.date].push(item)
    })
    return map
  }, [items])

  const days = useMemo(() => Object.keys(dayMap).sort(), [dayMap])
  const currentDateKey = days[activeDay]
  const dayItems = currentDateKey ? dayMap[currentDateKey] : []

  function resetForm() {
    setForm({ title: '', type: 'activity', date: new Date().toISOString().slice(0, 10), time: '', notes: '' })
  }

  async function handleAdd() {
    if (!form.title.trim() || !profile || !tripId) return
    await createItem.mutateAsync({
      trip_id: tripId,
      date: form.date,
      time: form.time.trim() || null,
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      type: form.type,
      created_by: profile.id,
    })
    resetForm()
    setShowAdd(false)
    const newDays = [...new Set([...days, form.date])].sort()
    const newIdx = newDays.indexOf(form.date)
    if (newIdx >= 0) setActiveDay(newIdx)
  }

  function confirmDelete(item: ItineraryItem) {
    Alert.alert('Delete Item', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteItem.mutate({ id: item.id, tripId }) },
    ])
  }

  if (!tripId || !trip) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.screenHeader}>
            <Text style={styles.h1}>Itinerary</Text>
          </View>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySub}>Create a trip from the Home tab first</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.screenHeader}>
          <Text style={styles.h1}>Itinerary</Text>
          <Text style={styles.sub}>{trip.name} · {days.length} day{days.length !== 1 ? 's' : ''}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorContent}
          style={styles.daySelector}
        >
          {days.map((date, i) => {
            const { num, lbl } = formatDayLabel(date, i)
            return (
              <TouchableOpacity
                key={date}
                style={[styles.dayChip, activeDay === i ? styles.dayChipActive : styles.dayChipInactive]}
                onPress={() => setActiveDay(i)}
              >
                <Text style={[styles.dayNum, activeDay === i ? styles.dayNumActive : styles.dayNumInactive]}>
                  {num}
                </Text>
                <Text style={[styles.dayLbl, activeDay === i ? styles.dayLblActive : styles.dayLblInactive]}>
                  {lbl}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.ocean} /></View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptySub}>Tap the button below to plan your first day</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.timeline} showsVerticalScrollIndicator={false}>
          {currentDateKey && (
            <Text style={styles.dayLabel}>
              {(() => { const { lbl } = formatDayLabel(currentDateKey, activeDay); return `Day ${activeDay + 1} · ${lbl}` })()}
            </Text>
          )}
          {dayItems.map((item, i) => {
            const tc = TL_COLORS[item.type]
            const isLast = i === dayItems.length - 1
            return (
              <View key={item.id} style={styles.tlItem}>
                <View style={styles.tlLeft}>
                  <Text style={styles.tlTime}>{item.time ?? '—'}</Text>
                  <View style={styles.tlLineTop} />
                  <View style={[styles.tlDot, { backgroundColor: tc.dot }]} />
                  {!isLast && <View style={styles.tlLineBottom} />}
                </View>
                <TouchableOpacity
                  style={styles.tlCard}
                  onLongPress={() => confirmDelete(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.tlCardTop}>
                    <Text style={styles.tlCardName} numberOfLines={2}>{item.title}</Text>
                    <View style={[styles.tlBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[styles.tlBadgeText, { color: tc.color }]}>{TYPE_LABELS[item.type]}</Text>
                    </View>
                  </View>
                  {item.notes ? <Text style={styles.tlNote}>"{item.notes}"</Text> : null}
                </TouchableOpacity>
              </View>
            )
          })}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Icon name="plus" size={16} color="white" />
        <Text style={styles.fabText}>Add Item</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAdd(false)}>
            <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add Itinerary Item</Text>

              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor={colors.muted}
                value={form.title}
                onChangeText={t => setForm(f => ({ ...f, title: t }))}
              />

              <View style={styles.typeRow}>
                {(['transport', 'stay', 'food', 'activity'] as ItemType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, form.type === t ? { backgroundColor: TL_COLORS[t].bg } : styles.typeChipInactive]}
                    onPress={() => setForm(f => ({ ...f, type: t }))}
                  >
                    <Text style={[styles.typeChipText, { color: form.type === t ? TL_COLORS[t].color : colors.muted }]}>
                      {TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <DateInput label="Date" value={form.date} onChange={d => setForm(f => ({ ...f, date: d }))} />

              <TextInput
                style={styles.input}
                placeholder="Time (e.g. 14:30) — optional"
                placeholderTextColor={colors.muted}
                value={form.time}
                onChangeText={t => setForm(f => ({ ...f, time: t }))}
              />

              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Notes — optional"
                placeholderTextColor={colors.muted}
                value={form.notes}
                onChangeText={t => setForm(f => ({ ...f, notes: t }))}
                multiline
                numberOfLines={3}
              />

              <AppButton
                label="Add"
                onPress={handleAdd}
                loading={createItem.isPending}
                style={{ marginTop: 8 }}
              />
              <View style={{ height: 20 }} />
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  safeHeader: { backgroundColor: colors.night },
  screenHeader: {
    backgroundColor: colors.night, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 16,
  },
  h1: { fontFamily: 'Fraunces_700Bold', fontSize: 32, color: colors.white, lineHeight: 36 },
  sub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  daySelector: { backgroundColor: colors.night },
  daySelectorContent: { gap: 8, paddingHorizontal: 18, paddingVertical: 14 },
  dayChip: {
    flexDirection: 'column', alignItems: 'center', gap: 2,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5,
  },
  dayChipActive: { backgroundColor: colors.sunset, borderColor: colors.sunset },
  dayChipInactive: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  dayNum: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, lineHeight: 18 },
  dayNumActive: { color: colors.white },
  dayNumInactive: { color: 'rgba(180,190,210,0.8)' },
  dayLbl: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 10, letterSpacing: 0.4 },
  dayLblActive: { color: 'rgba(255,220,200,0.9)' },
  dayLblInactive: { color: 'rgba(130,140,160,0.8)' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: colors.text },
  emptySub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },

  timeline: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 90 },
  dayLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: colors.text, marginBottom: 20 },

  tlItem: { flexDirection: 'row', alignItems: 'stretch' },
  tlLeft: { width: 52, flexShrink: 0, alignItems: 'center' },
  tlTime: {
    fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: colors.muted,
    letterSpacing: 0.2, paddingTop: 14, textAlign: 'center', width: '100%',
  },
  tlLineTop: { width: 2, backgroundColor: colors.border, height: 12 },
  tlDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.white, marginVertical: 4, zIndex: 1 },
  tlLineBottom: { width: 2, backgroundColor: colors.border, flex: 1, minHeight: 20 },
  tlCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 16,
    padding: 13, marginBottom: 10, marginLeft: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  tlCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  tlCardName: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: colors.text, lineHeight: 20, flex: 1 },
  tlBadge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 100 },
  tlBadgeText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  tlNote: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 6, fontStyle: 'italic' },

  fab: {
    position: 'absolute', bottom: 22, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.sunset, borderRadius: 100,
    paddingVertical: 14, paddingHorizontal: 28,
    shadowColor: colors.sunset,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  fabText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: colors.white },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontFamily: 'Fraunces_700Bold', fontSize: 24, color: colors.text, marginBottom: 16 },

  input: {
    backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.text,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },

  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeChip: { flex: 1, borderRadius: 100, paddingVertical: 8, alignItems: 'center' },
  typeChipInactive: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  typeChipText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },
})
