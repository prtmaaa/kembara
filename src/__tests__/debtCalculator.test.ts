import { calculateDebts } from '../utils/debtCalculator'
import { Profile, Expense, Settlement } from '../types'

function makeProfile(id: string, name: string): Profile {
  return { id, full_name: name, email: `${id}@test.com`, avatar_url: null, created_at: '' }
}

function makeExpense(
  id: string,
  paidBy: string,
  amountInBase: number,
  participants: { user_id: string; share_amount: number }[]
): Expense {
  return {
    id,
    trip_id: 'trip1',
    paid_by: paidBy,
    title: 'Test',
    amount: amountInBase,
    currency: 'IDR',
    amount_in_base: amountInBase,
    exchange_rate: 1,
    service_charge_pct: 0,
    tax_pct: 0,
    category: 'other',
    date: '2025-01-01',
    created_at: '',
    participants,
  } as any
}

function makeSettlement(fromId: string, toId: string, amount: number): Settlement {
  return { id: 's1', trip_id: 'trip1', from_user_id: fromId, to_user_id: toId, amount, currency: 'IDR', settled_at: '' }
}

const alice = makeProfile('alice', 'Alice')
const bob = makeProfile('bob', 'Bob')
const carol = makeProfile('carol', 'Carol')

describe('calculateDebts', () => {
  it('returns empty array when no expenses', () => {
    const result = calculateDebts([], [alice, bob], 'IDR')
    expect(result).toHaveLength(0)
  })

  it('returns empty array when no members', () => {
    const expense = makeExpense('e1', 'alice', 100, [
      { user_id: 'alice', share_amount: 50 },
      { user_id: 'bob', share_amount: 50 },
    ])
    const result = calculateDebts([expense], [], 'IDR')
    expect(result).toHaveLength(0)
  })

  it('simple two-person split: bob owes alice', () => {
    const expense = makeExpense('e1', 'alice', 100, [
      { user_id: 'alice', share_amount: 50 },
      { user_id: 'bob', share_amount: 50 },
    ])
    const result = calculateDebts([expense], [alice, bob], 'IDR')
    expect(result).toHaveLength(1)
    expect(result[0].from.id).toBe('bob')
    expect(result[0].to.id).toBe('alice')
    expect(result[0].amount).toBeCloseTo(50)
  })

  it('returns empty when single payer paid only their own share', () => {
    const expense = makeExpense('e1', 'alice', 50, [
      { user_id: 'alice', share_amount: 50 },
    ])
    const result = calculateDebts([expense], [alice, bob], 'IDR')
    expect(result).toHaveLength(0)
  })

  it('three-person split minimises transactions', () => {
    // Alice pays 300, split equally (100 each)
    // Bob owes 100, Carol owes 100
    const expense = makeExpense('e1', 'alice', 300, [
      { user_id: 'alice', share_amount: 100 },
      { user_id: 'bob', share_amount: 100 },
      { user_id: 'carol', share_amount: 100 },
    ])
    const result = calculateDebts([expense], [alice, bob, carol], 'IDR')
    expect(result).toHaveLength(2)
    const debtors = result.map(d => d.from.id)
    expect(debtors).toContain('bob')
    expect(debtors).toContain('carol')
    result.forEach(d => expect(d.to.id).toBe('alice'))
    result.forEach(d => expect(d.amount).toBeCloseTo(100))
  })

  it('cross debts: alice owes bob, carol owes bob — merged correctly', () => {
    // Bob pays 200 for alice+bob (100 each) → alice owes bob 100
    const e1 = makeExpense('e1', 'bob', 200, [
      { user_id: 'alice', share_amount: 100 },
      { user_id: 'bob', share_amount: 100 },
    ])
    // Alice pays 150 for alice+carol (75 each) → carol owes alice 75
    const e2 = makeExpense('e2', 'alice', 150, [
      { user_id: 'alice', share_amount: 75 },
      { user_id: 'carol', share_amount: 75 },
    ])
    const result = calculateDebts([e1, e2], [alice, bob, carol], 'IDR')
    // alice net: -100 (owed bob) + 75 (carol owes her) = -25 → owes bob 25
    // carol net: -75 → owes alice 75
    // bob net: +100
    const aliceDebt = result.find(d => d.from.id === 'alice')
    const carolDebt = result.find(d => d.from.id === 'carol')
    expect(aliceDebt).toBeDefined()
    expect(carolDebt).toBeDefined()
    expect(aliceDebt!.amount).toBeCloseTo(25)
    expect(carolDebt!.amount).toBeCloseTo(75)
  })

  it('ignores floating point noise below 1 cent', () => {
    // Amounts that produce very small floating point residuals
    const expense = makeExpense('e1', 'alice', 100, [
      { user_id: 'alice', share_amount: 33.333333 },
      { user_id: 'bob', share_amount: 33.333333 },
      { user_id: 'carol', share_amount: 33.333334 },
    ])
    const result = calculateDebts([expense], [alice, bob, carol], 'IDR')
    // No balance should exceed 0.01 threshold after rounding
    result.forEach(d => expect(d.amount).toBeGreaterThan(0.01))
  })

  it('uses baseCurrency in result', () => {
    const expense = makeExpense('e1', 'alice', 100, [
      { user_id: 'alice', share_amount: 50 },
      { user_id: 'bob', share_amount: 50 },
    ])
    const result = calculateDebts([expense], [alice, bob], 'THB')
    expect(result[0].currency).toBe('THB')
  })

  it('multiple expenses accumulate correctly', () => {
    // Alice pays 100, split with bob → bob owes 50
    const e1 = makeExpense('e1', 'alice', 100, [
      { user_id: 'alice', share_amount: 50 },
      { user_id: 'bob', share_amount: 50 },
    ])
    // Alice pays another 100, split with bob → bob owes another 50
    const e2 = makeExpense('e2', 'alice', 100, [
      { user_id: 'alice', share_amount: 50 },
      { user_id: 'bob', share_amount: 50 },
    ])
    const result = calculateDebts([e1, e2], [alice, bob], 'IDR')
    expect(result).toHaveLength(1)
    expect(result[0].from.id).toBe('bob')
    expect(result[0].amount).toBeCloseTo(100)
  })
})

describe('settlements offset debts', () => {
  it('full settlement clears the debt', () => {
    const expense = makeExpense('e1', 'alice', 100, [
      { user_id: 'alice', share_amount: 50 },
      { user_id: 'bob', share_amount: 50 },
    ])
    const settlement = makeSettlement('bob', 'alice', 50)
    const result = calculateDebts([expense], [alice, bob], 'IDR', [settlement])
    expect(result).toHaveLength(0)
  })

  it('partial settlement reduces remaining debt', () => {
    const expense = makeExpense('e1', 'alice', 100, [
      { user_id: 'alice', share_amount: 50 },
      { user_id: 'bob', share_amount: 50 },
    ])
    const settlement = makeSettlement('bob', 'alice', 30)
    const result = calculateDebts([expense], [alice, bob], 'IDR', [settlement])
    expect(result).toHaveLength(1)
    expect(result[0].from.id).toBe('bob')
    expect(result[0].amount).toBeCloseTo(20)
  })

  it('no settlements leaves debts unchanged', () => {
    const expense = makeExpense('e1', 'alice', 100, [
      { user_id: 'alice', share_amount: 50 },
      { user_id: 'bob', share_amount: 50 },
    ])
    const result = calculateDebts([expense], [alice, bob], 'IDR', [])
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBeCloseTo(50)
  })
})
