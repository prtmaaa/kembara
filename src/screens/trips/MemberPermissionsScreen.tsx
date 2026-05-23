import React, { useState, useEffect } from 'react'
import { View, Text, Switch, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useMembers, useUpdateMemberPermissions } from '../../hooks/useMembers'
import { TripPermissions, DEFAULT_MEMBER_PERMISSIONS } from '../../types'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'

const PERMISSION_LABELS: { key: keyof TripPermissions; label: string; description: string }[] = [
  { key: 'add_expense', label: 'Add Expenses', description: 'Can add new expenses to the trip' },
  { key: 'edit_expense', label: 'Edit Any Expense', description: "Can edit anyone's expenses, not just their own" },
  { key: 'delete_expense', label: 'Delete Any Expense', description: "Can delete anyone's expenses" },
  { key: 'invite_member', label: 'Invite Members', description: 'Can generate invite links and add new members' },
]

export default function MemberPermissionsScreen({ route, navigation }: any) {
  const { memberId, tripId, memberName } = route.params
  const { data: memberRows = [], isLoading } = useMembers(tripId)
  const updatePermissions = useUpdateMemberPermissions()

  const member = memberRows.find(m => m.id === memberId)
  const [perms, setPerms] = useState<TripPermissions>(DEFAULT_MEMBER_PERMISSIONS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (member?.permissions) setPerms(member.permissions)
  }, [member])

  function toggle(key: keyof TripPermissions) {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  async function handleSave() {
    await updatePermissions.mutateAsync({ memberId, tripId, permissions: perms })
    setSaved(true)
    setTimeout(() => navigation.goBack(), 800)
  }

  if (isLoading) return <View style={styles.loader}><ActivityIndicator color={colors.ocean} /></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Permissions for {memberName}</Text>

      {PERMISSION_LABELS.map(({ key, label, description }) => (
        <View key={key} style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowDesc}>{description}</Text>
          </View>
          <Switch
            value={perms[key]}
            onValueChange={() => toggle(key)}
            trackColor={{ true: colors.ocean, false: colors.sand }}
            thumbColor={colors.white}
          />
        </View>
      ))}

      <AppButton
        label={saved ? 'Saved ✓' : 'Save Permissions'}
        onPress={handleSave}
        loading={updatePermissions.isPending}
        style={styles.btn}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, gap: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  rowInfo: { flex: 1 },
  rowLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.text },
  rowDesc: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  btn: { marginTop: 8 },
})
