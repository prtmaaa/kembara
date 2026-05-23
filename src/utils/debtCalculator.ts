import { ExpenseParticipant, Expense, Profile, DebtSummary } from '../types'

type Balance = { userId: string; amount: number }

export function calculateDebts(
  expenses: Expense[],
  members: Profile[],
  baseCurrency: string = 'IDR'
): DebtSummary[] {
  const balances: Record<string, number> = {}

  members.forEach((m) => (balances[m.id] = 0))

  for (const expense of expenses) {
    balances[expense.paid_by] = (balances[expense.paid_by] || 0) + expense.amount_in_base

    for (const participant of expense.participants || []) {
      balances[participant.user_id] =
        (balances[participant.user_id] || 0) - participant.share_amount
    }
  }

  const creditors: Balance[] = []
  const debtors: Balance[] = []

  for (const [userId, amount] of Object.entries(balances)) {
    if (amount > 0.01) creditors.push({ userId, amount })
    else if (amount < -0.01) debtors.push({ userId, amount: -amount })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const result: DebtSummary[] = []

  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    const fromProfile = members.find((m) => m.id === debtor.userId)!
    const toProfile = members.find((m) => m.id === creditor.userId)!

    result.push({ from: fromProfile, to: toProfile, amount, currency: baseCurrency })

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  return result
}
