import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, Alert,
  SafeAreaView, TouchableOpacity,
} from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'
import AppInput from '../../components/ui/AppInput'
import AvatarInitials from '../../components/ui/AvatarInitials'

export default function ProfileScreen({ navigation }: any) {
  const { profile, signOut } = useAuth()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saved, setSaved] = useState(false)

  const updateProfile = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim() })
        .eq('id', profile!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function confirmSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  if (!profile) return null

  const displayName = profile.full_name ?? profile.email ?? ''

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <AvatarInitials name={displayName} index={0} size={72} />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        <View style={styles.section}>
          <AppInput
            label="Full Name"
            value={fullName}
            onChangeText={(t) => { setFullName(t); setSaved(false) }}
            placeholder="Your name"
          />
          <AppButton
            label={saved ? 'Saved ✓' : 'Save Changes'}
            onPress={() => updateProfile.mutate(fullName)}
            loading={updateProfile.isPending}
            disabled={!fullName.trim() || fullName.trim() === profile.full_name}
            style={styles.saveBtn}
          />
        </View>

        <AppButton
          label="Sign Out"
          onPress={confirmSignOut}
          variant="secondary"
          style={styles.signOutBtn}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  safeHeader: { backgroundColor: colors.night },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18,
    backgroundColor: colors.night,
  },
  backBtn: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: colors.white, width: 60 },
  headerTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24, color: colors.white },
  content: { padding: 24, gap: 24 },
  avatarWrap: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  name: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 26, color: colors.text },
  email: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: colors.muted },
  section: { gap: 16 },
  saveBtn: { marginTop: 4 },
  signOutBtn: { marginTop: 8 },
})
