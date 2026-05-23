import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Settlement } from '../types'

export function useSettlements(tripId: string) {
  return useQuery({
    queryKey: ['settlements', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlements')
        .select('*, from_profile:profiles!from_user_id(*), to_profile:profiles!to_user_id(*)')
        .eq('trip_id', tripId)
        .order('settled_at', { ascending: false })
      if (error) throw error
      return data as Settlement[]
    },
    enabled: !!tripId,
  })
}

export function useCreateSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settlement: Omit<Settlement, 'id' | 'settled_at' | 'from_profile' | 'to_profile'>) => {
      const { data, error } = await supabase
        .from('settlements')
        .insert(settlement)
        .select()
        .single()
      if (error) throw error
      return data as Settlement
    },
    onSuccess: (settlement) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', settlement.trip_id] })
      queryClient.invalidateQueries({ queryKey: ['expenses', settlement.trip_id] })
    },
  })
}
