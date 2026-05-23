import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Trip } from '../types'

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Trip[]
    },
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      destination: string
      base_currency: string
      budget: number | null
      start_date: string | null
      end_date: string | null
      created_by: string
    }) => {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert(input)
        .select()
        .single()
      if (tripError) throw tripError

      const { error: memberError } = await supabase
        .from('trip_members')
        .insert({ trip_id: trip.id, user_id: input.created_by, role: 'owner' })
      if (memberError) throw memberError

      return trip as Trip
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trip> & { id: string }) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Trip
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['trip', trip.id] })
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase.from('trips').delete().eq('id', tripId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
}
