import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Expense } from '../types'

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, paid_by_profile:profiles!paid_by(*), participants:expense_participants(*, profile:profiles(*))')
        .eq('trip_id', tripId)
        .order('date', { ascending: false })
      if (error) throw error
      return data as Expense[]
    },
    enabled: !!tripId,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      expense,
      participantIds,
      splitEvenly,
      customShares,
    }: {
      expense: Omit<Expense, 'id' | 'created_at' | 'paid_by_profile' | 'participants'>
      participantIds: string[]
      splitEvenly: boolean
      customShares?: Record<string, number>
    }) => {
      const { data: created, error: expError } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single()
      if (expError) throw expError

      const shares = participantIds.map((userId) => ({
        expense_id: created.id,
        user_id: userId,
        share_amount: splitEvenly
          ? created.amount_in_base / participantIds.length
          : (customShares?.[userId] ?? 0),
      }))

      const { error: partError } = await supabase
        .from('expense_participants')
        .insert(shares)
      if (partError) throw partError

      return created as Expense
    },
    onSuccess: (expense) =>
      queryClient.invalidateQueries({ queryKey: ['expenses', expense.trip_id] }),
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      expenseId,
      tripId,
      updates,
      participantIds,
      splitEvenly,
      customShares,
    }: {
      expenseId: string
      tripId: string
      updates: Partial<Omit<Expense, 'id' | 'created_at' | 'paid_by_profile' | 'participants'>>
      participantIds: string[]
      splitEvenly: boolean
      customShares?: Record<string, number>
    }) => {
      const { data: updated, error: expError } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', expenseId)
        .select()
        .single()
      if (expError) throw expError

      await supabase.from('expense_participants').delete().eq('expense_id', expenseId)

      const amountInBase = updated.amount_in_base
      const shares = participantIds.map((userId) => ({
        expense_id: expenseId,
        user_id: userId,
        share_amount: splitEvenly
          ? amountInBase / participantIds.length
          : (customShares?.[userId] ?? 0),
      }))

      const { error: partError } = await supabase
        .from('expense_participants')
        .insert(shares)
      if (partError) throw partError

      return updated as Expense
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['expenses', vars.tripId] }),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ expenseId, tripId }: { expenseId: string; tripId: string }) => {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
      if (error) throw error
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['expenses', vars.tripId] }),
  })
}
