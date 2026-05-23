export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type TripPermissions = {
  add_expense: boolean
  edit_expense: boolean
  delete_expense: boolean
  invite_member: boolean
}

export const DEFAULT_MEMBER_PERMISSIONS: TripPermissions = {
  add_expense: true,
  edit_expense: true,
  delete_expense: true,
  invite_member: true,
}

export type Trip = {
  id: string
  name: string
  destination: string
  base_currency: string
  budget: number | null
  start_date: string | null
  end_date: string | null
  created_by: string
  created_at: string
}

export type TripMember = {
  id: string
  trip_id: string
  user_id: string
  role: 'owner' | 'member'
  permissions: TripPermissions
  joined_at: string
  profile?: Profile
}

export type TripInvite = {
  id: string
  trip_id: string
  token: string
  created_by: string
  created_at: string
  expires_at: string | null
}

export type Expense = {
  id: string
  trip_id: string
  paid_by: string
  title: string
  amount: number
  currency: string
  amount_in_base: number
  exchange_rate: number
  service_charge_pct: number
  tax_pct: number
  category: ExpenseCategory
  date: string
  created_at: string
  paid_by_profile?: Profile
  participants?: ExpenseParticipant[]
}

export type ExpenseParticipant = {
  id: string
  expense_id: string
  user_id: string
  share_amount: number
  profile?: Profile
}

export type Settlement = {
  id: string
  trip_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  currency: string
  settled_at: string
  from_profile?: Profile
  to_profile?: Profile
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'shopping'
  | 'other'

export type DebtSummary = {
  from: Profile
  to: Profile
  amount: number
  currency: string
}
