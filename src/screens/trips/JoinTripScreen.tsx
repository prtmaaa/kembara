import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'
import { DEFAULT_MEMBER_PERMISSIONS } from '../../types'

export default function JoinTripScreen({ route, navigation }: any) {
  const { token } = route.params
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [trip, setTrip] = useState<{ id: string; name: string; destination: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [alreadyMember, setAlreadyMember] = useState(false)

  useEffect(() => {
    lookupToken()
  }, [token])

  async function lookupToken() {
    const { data: invite } = await supabase
      .from('trip_invites')
      .select('trip_id, trips(id, name, destination)')
      .eq('token', token)
      .single()

    if (!invite) { setError('This invite link is invalid or has expired.'); setLoading(false); return }

    const tripData = invite.trips as any
    setTrip({ id: tripData.id, name: tripData.name, destination: tripData.destination })

    const { data: existing } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripData.id)
      .eq('user_id', profile!.id)
      .single()

    if (existing) setAlreadyMember(true)
    setLoading(false)
  }

  async function joinTrip() {
    if (!trip || !profile) return
    setJoining(true)
    const { error: err } = await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: profile.id,
      role: 'member',
      permissions: DEFAULT_MEMBER_PERMISSIONS,
    })
    if (err) { setError(err.message); setJoining(false); return }
    queryClient.invalidateQueries({ queryKey: ['trips'] })
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.ocean} size="large" /></View>

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Invalid Link</Text>
      <Text style={styles.errorSub}>{error}</Text>
      <AppButton label="Go Home" onPress={() => navigation.navigate('Main')} style={{ marginTop: 24 }} />
    </View>
  )

  return (
    <View style={styles.center}>
      <Text style={styles.label}>You've been invited to</Text>
      <Text style={styles.tripName}>{trip?.name}</Text>
      <Text style={styles.destination}>{trip?.destination}</Text>
      {alreadyMember ? (
        <>
          <Text style={styles.alreadyText}>You're already a member of this trip.</Text>
          <AppButton label="Open Trip" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} style={{ marginTop: 24 }} />
        </>
      ) : (
        <AppButton label="Join Trip" onPress={joinTrip} loading={joining} style={{ marginTop: 32 }} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center', alignItems: 'center', padding: 28 },
  label: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.muted, marginBottom: 8 },
  tripName: { fontFamily: 'Fraunces_700Bold', fontSize: 36, color: colors.text, textAlign: 'center' },
  destination: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 6 },
  alreadyText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 16, textAlign: 'center' },
  errorTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: colors.text, marginBottom: 8 },
  errorSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.muted, textAlign: 'center' },
})
