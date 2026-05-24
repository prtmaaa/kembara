import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type ItineraryItem = {
  id: string
  trip_id: string
  date: string
  time: string | null
  title: string
  notes: string | null
  type: 'transport' | 'stay' | 'food' | 'activity'
  created_by: string
  created_at: string
}

export function useItineraryItems(tripId: string) {
  return useQuery({
    queryKey: ['itinerary', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true })
        .order('time', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as ItineraryItem[]
    },
    enabled: !!tripId,
  })
}

export function useCreateItineraryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (item: Omit<ItineraryItem, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('itinerary_items')
        .insert(item)
        .select()
        .single()
      if (error) throw error
      return data as ItineraryItem
    },
    onSuccess: (item) => queryClient.invalidateQueries({ queryKey: ['itinerary', item.trip_id] }),
  })
}

export function useDeleteItineraryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const { error } = await supabase.from('itinerary_items').delete().eq('id', id)
      if (error) throw error
      return tripId
    },
    onSuccess: (tripId) => queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] }),
  })
}
