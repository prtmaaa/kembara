import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../hooks/useAuth'
import { colors } from '../theme'

export default function HeaderUser({ light = false }: { light?: boolean }) {
  const { profile } = useAuth()
  const navigation = useNavigation<any>()

  if (!profile) return null

  const name = profile.full_name ?? profile.email ?? ''
  const letters = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
      <View style={[styles.avatar, light && styles.avatarLight]}>
        <Text style={styles.avatarText}>{letters}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarLight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.white, fontSize: 13 },
})
