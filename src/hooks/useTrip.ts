import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Trip } from '../types'

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single()
      if (error) throw error
      return data as Trip
    },
    enabled: !!tripId,
  })
}
