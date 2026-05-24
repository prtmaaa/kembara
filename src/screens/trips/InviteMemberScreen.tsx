import React, { useState } from 'react'
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Share,
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useMembers, useRemoveMember } from '../../hooks/useMembers'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'
import AvatarInitials from '../../components/ui/AvatarInitials'
import Icon from '../../components/Icon'

function generateToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export default function InviteMemberScreen({ route, navigation }: any) {
  const { tripId } = route.params
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: members = [], isLoading: membersLoading } = useMembers(tripId)
  const removeMember = useRemoveMember()
  const [qrVisible, setQrVisible] = useState(false)

  const { data: invite, isLoading: inviteLoading } = useQuery({
    queryKey: ['invite', tripId],
    queryFn: async () => {
      const { data } = await supabase
        .from('trip_invites')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
  })

  const createInvite = useMutation({
    mutationFn: async () => {
      const token = generateToken()
      const { data, error } = await supabase
        .from('trip_invites')
        .insert({ trip_id: tripId, token, created_by: profile!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invite', tripId] }),
  })

  const inviteLink = invite ? `kembara://join/${invite.token}` : null

  async function handleShare() {
    if (!inviteLink) return
    await Share.share({ message: inviteLink })
  }

  function handleRemoveMember(memberId: string, memberName: string) {
    Alert.alert(
      'Remove Member',
      `Remove ${memberName} from this trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember.mutate({ memberId, tripId }),
        },
      ]
    )
  }

  const currentMember = members.find(m => m.user_id === profile?.id)
  const isOwner = currentMember?.role === 'owner'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Invite Link</Text>

      {inviteLoading ? (
        <ActivityIndicator color={colors.ocean} style={{ marginVertical: 16 }} />
      ) : invite ? (
        <View style={styles.linkCard}>
          <Icon name="link" size={18} color={colors.ocean} />
          <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
            {inviteLink}
          </Text>
        </View>
      ) : null}

      <View style={styles.linkActions}>
        {invite ? (
          <>
            <AppButton
              label="Share Link"
              onPress={handleShare}
              style={styles.actionBtn}
            />
            <TouchableOpacity style={styles.qrBtn} onPress={() => setQrVisible(true)}>
              <Icon name="qr" size={20} color={colors.ocean} />
              <Text style={styles.qrBtnText}>QR Code</Text>
            </TouchableOpacity>
          </>
        ) : (
          <AppButton
            label="Generate Invite Link"
            onPress={() => createInvite.mutate()}
            loading={createInvite.isPending}
          />
        )}
      </View>

      <Modal visible={qrVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Scan to Join</Text>
            <Text style={styles.modalSub}>Share this QR code with your travel companions</Text>
            <View style={styles.qrWrap}>
              {inviteLink && <QRCode value={inviteLink} size={200} backgroundColor="transparent" />}
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setQrVisible(false)}>
              <Icon name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
        Members ({members.length})
      </Text>

      {membersLoading ? (
        <ActivityIndicator color={colors.ocean} />
      ) : (
        members.map((member, index) => {
          const memberProfile = (member as any).profile
          const name = memberProfile?.full_name ?? memberProfile?.email ?? 'Unknown'
          const isCurrentUser = member.user_id === profile?.id
          const canManage = isOwner && !isCurrentUser

          return (
            <View key={member.id} style={styles.memberRow}>
              <AvatarInitials name={name} index={index} size={40} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {name}{isCurrentUser ? ' (you)' : ''}
                </Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              {canManage && (
                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => navigation.navigate('MemberPermissions', {
                      memberId: member.id,
                      tripId,
                      memberName: name,
                    })}
                  >
                    <Icon name="edit" size={16} color={colors.ocean} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleRemoveMember(member.id, name)}
                  >
                    <Icon name="trash" size={16} color={colors.sunset} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, gap: 12 },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: colors.text,
  },
  linkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  linkText: {
    flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13,
    color: colors.ocean,
  },
  linkActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  actionBtn: { flex: 1 },
  qrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.white, borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  qrBtnText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: colors.ocean },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: colors.white, borderRadius: 24,
    padding: 28, alignItems: 'center', width: 300,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 26, color: colors.text,
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: colors.muted,
    textAlign: 'center', marginBottom: 20,
  },
  qrWrap: {
    padding: 16, backgroundColor: colors.cream, borderRadius: 16,
    marginBottom: 20,
  },
  modalCloseBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.sand, justifyContent: 'center', alignItems: 'center',
  },

  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: colors.text },
  memberRole: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.muted,
    textTransform: 'capitalize', marginTop: 2,
  },
  memberActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.sand, justifyContent: 'center', alignItems: 'center',
  },
})
