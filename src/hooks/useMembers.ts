import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TripMember, TripPermissions, DEFAULT_MEMBER_PERMISSIONS } from '../types'

export function useMembers(tripId: string) {
  return useQuery({
    queryKey: ['members', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_members')
        .select('*, profile:profiles(*)')
        .eq('trip_id', tripId)
      if (error) throw error
      return (data ?? []).map((m: any) => ({
        ...m,
        permissions: m.permissions ?? DEFAULT_MEMBER_PERMISSIONS,
      })) as TripMember[]
    },
    enabled: !!tripId,
  })
}

export function useUpdateMemberPermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      memberId,
      tripId,
      permissions,
    }: {
      memberId: string
      tripId: string
      permissions: TripPermissions
    }) => {
      const { error } = await supabase
        .from('trip_members')
        .update({ permissions })
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['members', vars.tripId] }),
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, tripId }: { memberId: string; tripId: string }) => {
      const { error } = await supabase
        .from('trip_members')
        .delete()
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['members', vars.tripId] }),
  })
}
