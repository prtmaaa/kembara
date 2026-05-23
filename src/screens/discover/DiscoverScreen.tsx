import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView,
} from 'react-native'
import { colors } from '../../theme'
import Icon from '../../components/Icon'

const DISC_CATS = ['all', 'restaurant', 'landmark', 'temple', 'beach', 'activity']
const DISC_LABELS: Record<string, string> = {
  all: 'All', restaurant: 'Eat', landmark: 'Sights',
  temple: 'Temples', beach: 'Beaches', activity: 'Activities',
}

const PLACES = [
  { id: 1, name: 'Locavore',          cat: 'restaurant', dist: '0.3 km', rating: 4.9, tags: ['Fine Dining', 'Indonesian'], saved: true,  color: '#E5C9A0' },
  { id: 2, name: 'Tegalalang Terraces',cat: 'landmark',   dist: '8 km',   rating: 4.7, tags: ['Nature', 'Photography'],    saved: false, color: '#A0C9A0' },
  { id: 3, name: 'Tirta Empul',        cat: 'temple',     dist: '12 km',  rating: 4.8, tags: ['Spiritual', 'Heritage'],    saved: true,  color: '#A0C0D8' },
  { id: 4, name: 'Seminyak Beach',     cat: 'beach',      dist: '35 km',  rating: 4.6, tags: ['Sunset', 'Swimming'],       saved: false, color: '#A0D0E8' },
  { id: 5, name: 'Kecak Fire Dance',   cat: 'activity',   dist: '45 km',  rating: 5.0, tags: ['Culture', 'Performance'],   saved: true,  color: '#C0A0D8' },
  { id: 6, name: 'Monkey Forest',      cat: 'activity',   dist: '1 km',   rating: 4.4, tags: ['Nature', 'Wildlife'],       saved: false, color: '#A0D0B8' },
]

export default function DiscoverScreen() {
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [saved, setSaved] = useState(new Set(PLACES.filter(p => p.saved).map(p => p.id)))

  const filtered = PLACES.filter(p => {
    const matchCat = activeCat === 'all' || p.cat === activeCat
    const matchQ = !query || p.name.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQ
  })

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.screenHeader}>
          <Text style={styles.h1}>Discover</Text>
          <Text style={styles.sub}>Bali, Indonesia</Text>
        </View>

        {/* Search bar — still in dark area */}
        <View style={styles.searchBar}>
          <View style={styles.searchWrap}>
            <Icon name="search" size={16} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search places…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Category pills — cream background */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catContent}
        style={styles.catScroll}
      >
        {DISC_CATS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.pill, activeCat === c ? styles.pillActive : styles.pillInactive]}
            onPress={() => setActiveCat(c)}
          >
            <Text style={[styles.pillText, activeCat === c ? styles.pillTextActive : styles.pillTextInactive]}>
              {DISC_LABELS[c]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Places grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        <View style={styles.gridRow}>
          {filtered.map((p, i) => (
            <TouchableOpacity key={p.id} style={styles.placeCard} activeOpacity={0.85}>
              {/* Thumbnail */}
              <View style={[styles.thumb, { backgroundColor: p.color }]}>
                <View style={styles.thumbStripes} />
                <Text style={styles.thumbLabel}>{p.cat.toUpperCase()}</Text>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => setSaved(s => {
                    const n = new Set(s)
                    n.has(p.id) ? n.delete(p.id) : n.add(p.id)
                    return n
                  })}
                >
                  <Icon
                    name={saved.has(p.id) ? 'heartFill' : 'heart'}
                    size={14}
                    color={saved.has(p.id) ? '#e06b5a' : '#999'}
                  />
                </TouchableOpacity>
              </View>

              {/* Info */}
              <View style={styles.placeInfo}>
                <Text style={styles.placeName} numberOfLines={2}>{p.name}</Text>
                <View style={styles.placeTags}>
                  {p.tags.map(t => (
                    <View key={t} style={styles.placeTag}>
                      <Text style={styles.placeTagText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.placeMeta}>
                  <View style={styles.placeDist}>
                    <Icon name="pin" size={10} color={colors.muted} />
                    <Text style={styles.placeDistText}>{p.dist}</Text>
                  </View>
                  <View style={styles.placeRating}>
                    <Icon name="starFill" size={11} color={colors.sunset} fill={colors.sunset} />
                    <Text style={styles.placeRatingText}>{p.rating}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  safeHeader: { backgroundColor: colors.night },

  screenHeader: {
    backgroundColor: colors.night,
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 0,
  },
  h1: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 32, color: colors.white, lineHeight: 36 },
  sub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  searchBar: { backgroundColor: colors.night, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  searchWrap: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.white,
  },

  catScroll: { backgroundColor: colors.cream },
  catContent: { gap: 8, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 4 },
  pill: { borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  pillActive: { backgroundColor: colors.night },
  pillInactive: { backgroundColor: colors.sand },
  pillText: { fontFamily: 'DMSans_500Medium', fontSize: 12 },
  pillTextActive: { color: colors.white },
  pillTextInactive: { color: colors.muted },

  grid: { paddingHorizontal: 18 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 12 },
  placeCard: {
    width: '47%', backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  thumb: { height: 100, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  thumbStripes: { ...StyleSheet.absoluteFillObject, opacity: 0.12 },
  thumbLabel: {
    fontFamily: 'DMSans_400Regular', fontSize: 9, color: 'rgba(0,0,0,0.5)',
    letterSpacing: 1,
  },
  saveBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  placeInfo: { padding: 11 },
  placeName: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.text, lineHeight: 17, marginBottom: 6 },
  placeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  placeTag: { backgroundColor: colors.sand, borderRadius: 100, paddingVertical: 2, paddingHorizontal: 7 },
  placeTagText: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.muted },
  placeMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeDist: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  placeDistText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted },
  placeRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  placeRatingText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: colors.text },
})
