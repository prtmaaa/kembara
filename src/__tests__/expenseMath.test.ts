// Tests for the expense amount calculation logic used in AddExpenseScreen / EditExpenseScreen.

function calcTotalAmount(subtotal: number, svcPct: number, taxPct: number): number {
  return subtotal * (1 + svcPct / 100 + taxPct / 100)
}

function calcAmountInBase(totalAmount: number, rate: number): number {
  return totalAmount * rate
}

function calcEvenShare(amountInBase: number, participantCount: number): number {
  if (participantCount === 0) return 0
  return amountInBase / participantCount
}

describe('calcTotalAmount', () => {
  it('no charges: total equals subtotal', () => {
    expect(calcTotalAmount(100_000, 0, 0)).toBeCloseTo(100_000)
  })

  it('service charge only', () => {
    expect(calcTotalAmount(100_000, 10, 0)).toBeCloseTo(110_000)
  })

  it('tax only', () => {
    expect(calcTotalAmount(100_000, 0, 11)).toBeCloseTo(111_000)
  })

  it('service charge + tax combined', () => {
    // 100,000 + 10% + 11% = 121,000
    expect(calcTotalAmount(100_000, 10, 11)).toBeCloseTo(121_000)
  })

  it('fractional percentage', () => {
    expect(calcTotalAmount(50_000, 5.5, 0)).toBeCloseTo(52_750)
  })
})

describe('calcAmountInBase', () => {
  it('same currency: rate 1', () => {
    expect(calcAmountInBase(100_000, 1)).toBeCloseTo(100_000)
  })

  it('USD to IDR at 16000', () => {
    expect(calcAmountInBase(10, 16_000)).toBeCloseTo(160_000)
  })

  it('JPY to IDR at 105', () => {
    expect(calcAmountInBase(1000, 105)).toBeCloseTo(105_000)
  })
})

describe('calcEvenShare', () => {
  it('splits evenly between 3', () => {
    expect(calcEvenShare(300_000, 3)).toBeCloseTo(100_000)
  })

  it('splits 100 between 3 (float result)', () => {
    expect(calcEvenShare(100, 3)).toBeCloseTo(33.333, 2)
  })

  it('returns 0 when no participants', () => {
    expect(calcEvenShare(100_000, 0)).toBe(0)
  })

  it('solo payer is their own participant', () => {
    expect(calcEvenShare(50_000, 1)).toBeCloseTo(50_000)
  })
})

describe('end-to-end: foreign currency expense', () => {
  it('USD dinner, 10% service, 11% tax, split 3 ways at 16000 IDR/USD', () => {
    const subtotal = 30 // USD
    const svcPct = 10
    const taxPct = 11
    const rate = 16_000

    const total = calcTotalAmount(subtotal, svcPct, taxPct)
    expect(total).toBeCloseTo(36.3) // 30 * 1.21

    const totalInBase = calcAmountInBase(total, rate)
    expect(totalInBase).toBeCloseTo(580_800)

    const perPerson = calcEvenShare(totalInBase, 3)
    expect(perPerson).toBeCloseTo(193_600)
  })
})
