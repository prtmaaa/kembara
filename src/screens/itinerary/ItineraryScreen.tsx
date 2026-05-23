import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native'
import { colors } from '../../theme'
import Icon from '../../components/Icon'

const TL_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  transport: { bg: colors.lavenderSoft, color: colors.lavender, dot: colors.lavender },
  stay:      { bg: colors.oceanSoft,    color: colors.ocean,    dot: colors.ocean },
  food:      { bg: colors.sunsetSoft,   color: colors.sunset,   dot: colors.sunset },
  activity:  { bg: colors.forestSoft,   color: colors.forest,   dot: colors.forest },
}

const SAMPLE_DAYS = [
  {
    day: 1, date: 'Hari 1', label: 'Tiba',
    activities: [
      { time: '14:30', name: 'Tiba di destinasi', type: 'transport', duration: '30 min', note: 'Transfer ke hotel' },
      { time: '16:00', name: 'Check-in Hotel', type: 'stay', duration: '1 jam', note: '' },
      { time: '19:00', name: 'Makan malam perdana', type: 'food', duration: '1.5 jam', note: '' },
    ],
  },
  {
    day: 2, date: 'Hari 2', label: 'Eksplorasi',
    activities: [
      { time: '09:00', name: 'Sarapan di kafe lokal', type: 'food', duration: '45 menit', note: '' },
      { time: '11:00', name: 'Wisata budaya', type: 'activity', duration: '2 jam', note: 'Bawa kamera' },
      { time: '14:00', name: 'Makan siang', type: 'food', duration: '1 jam', note: '' },
      { time: '16:00', name: 'Sunset spot', type: 'activity', duration: '2 jam', note: 'Terbaik saat golden hour' },
    ],
  },
]

export default function ItineraryScreen() {
  const [activeDay, setActiveDay] = useState(0)
  const day = SAMPLE_DAYS[activeDay]

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.screenHeader}>
          <Text style={styles.h1}>Itinerary</Text>
          <Text style={styles.sub}>Bali Escape · {SAMPLE_DAYS.length} hari</Text>
        </View>

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorContent}
          style={styles.daySelector}
        >
          {SAMPLE_DAYS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayChip, activeDay === i ? styles.dayChipActive : styles.dayChipInactive]}
              onPress={() => setActiveDay(i)}
            >
              <Text style={[styles.dayNum, activeDay === i ? styles.dayNumActive : styles.dayNumInactive]}>
                {d.day}
              </Text>
              <Text style={[styles.dayLbl, activeDay === i ? styles.dayLblActive : styles.dayLblInactive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.timeline} showsVerticalScrollIndicator={false}>
        <Text style={styles.dayLabel}>{day.date} — {day.label}</Text>

        {day.activities.map((act, i) => {
          const tc = TL_COLORS[act.type] ?? TL_COLORS.activity
          const isLast = i === day.activities.length - 1
          return (
            <View key={i} style={styles.tlItem}>
              <View style={styles.tlLeft}>
                <Text style={styles.tlTime}>{act.time}</Text>
                <View style={styles.tlLineTop} />
                <View style={[styles.tlDot, { backgroundColor: tc.dot }]} />
                {!isLast && <View style={styles.tlLineBottom} />}
              </View>
              <View style={styles.tlCard}>
                <View style={styles.tlCardTop}>
                  <Text style={styles.tlCardName} numberOfLines={2}>{act.name}</Text>
                  <View style={[styles.tlBadge, { backgroundColor: tc.bg }]}>
                    <Text style={[styles.tlBadgeText, { color: tc.color }]}>{act.type}</Text>
                  </View>
                </View>
                {act.note ? <Text style={styles.tlNote}>"{act.note}"</Text> : null}
                <View style={styles.tlDuration}>
                  <Icon name="clock" size={11} color={colors.muted} />
                  <Text style={styles.tlDurationText}>{act.duration}</Text>
                </View>
              </View>
            </View>
          )
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  safeHeader: { backgroundColor: colors.night },

  screenHeader: {
    backgroundColor: colors.night,
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 16,
  },
  h1: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 32, color: colors.white, lineHeight: 36 },
  sub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  daySelector: { backgroundColor: colors.night },
  daySelectorContent: {
    gap: 8, paddingHorizontal: 18, paddingVertical: 14,
  },
  dayChip: {
    flexDirection: 'column', alignItems: 'center', gap: 2,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14,
    borderWidth: 1.5,
  },
  dayChipActive: { backgroundColor: colors.sunset, borderColor: colors.sunset },
  dayChipInactive: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  dayNum: { fontFamily: 'DMSans_600SemiBold', fontSize: 16, lineHeight: 18 },
  dayNumActive: { color: colors.white },
  dayNumInactive: { color: 'rgba(180,190,210,0.8)' },
  dayLbl: { fontFamily: 'DMSans_500Medium', fontSize: 10, letterSpacing: 0.4 },
  dayLblActive: { color: 'rgba(255,220,200,0.9)' },
  dayLblInactive: { color: 'rgba(130,140,160,0.8)' },

  timeline: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 90 },
  dayLabel: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: colors.text, marginBottom: 20 },

  tlItem: { flexDirection: 'row', alignItems: 'stretch' },
  tlLeft: { width: 52, flexShrink: 0, alignItems: 'center' },
  tlTime: {
    fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: colors.muted,
    letterSpacing: 0.2, paddingTop: 14, textAlign: 'center', width: '100%',
  },
  tlLineTop: { width: 2, backgroundColor: colors.border, flex: 0, height: 12 },
  tlDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.white, marginVertical: 4, zIndex: 1 },
  tlLineBottom: { width: 2, backgroundColor: colors.border, flex: 1, minHeight: 20 },

  tlCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 16,
    padding: 13, marginBottom: 10, marginLeft: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  tlCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  tlCardName: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text, lineHeight: 20, flex: 1 },
  tlBadge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 100 },
  tlBadgeText: { fontFamily: 'DMSans_600SemiBold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  tlNote: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 6, fontStyle: 'italic' },
  tlDuration: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  tlDurationText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted },
})
