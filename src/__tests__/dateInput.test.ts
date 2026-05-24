// Tests for the helper functions in DateInput component.
// Functions are extracted here to avoid importing React Native modules.

function parseDate(str: string): Date {
  if (!str) return new Date()
  const [y, m, d] = str.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return isNaN(dt.getTime()) ? new Date() : dt
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function displayDate(str: string): string {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`
}

describe('parseDate', () => {
  it('parses a valid YYYY-MM-DD string as local time', () => {
    const d = parseDate('2025-06-01')
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(5) // June = index 5
    expect(d.getDate()).toBe(1)
  })

  it('returns today for empty string', () => {
    const today = new Date()
    const d = parseDate('')
    expect(d.getFullYear()).toBe(today.getFullYear())
    expect(d.getMonth()).toBe(today.getMonth())
  })

  it('returns today for malformed string (no crash)', () => {
    const before = new Date()
    const d = parseDate('not-a-date')
    const after = new Date()
    expect(d.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000)
    expect(d.getTime()).toBeLessThanOrEqual(after.getTime() + 1000)
  })

  it('handles leap year correctly', () => {
    const d = parseDate('2024-02-29')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(1)
    expect(d.getDate()).toBe(29)
  })
})

describe('formatDate', () => {
  it('formats a date to YYYY-MM-DD', () => {
    const d = new Date(2025, 5, 1) // local: June 1 2025
    expect(formatDate(d)).toBe('2025-06-01')
  })

  it('zero-pads month and day', () => {
    const d = new Date(2025, 0, 9) // Jan 9
    expect(formatDate(d)).toBe('2025-01-09')
  })

  it('is the inverse of parseDate', () => {
    const original = '2025-11-23'
    expect(formatDate(parseDate(original))).toBe(original)
  })
})

describe('displayDate', () => {
  it('returns empty string for empty input', () => {
    expect(displayDate('')).toBe('')
  })

  it('formats YYYY-MM-DD to "DD Mon YYYY"', () => {
    expect(displayDate('2025-06-01')).toBe('01 Jun 2025')
  })

  it('handles all 12 months', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    months.forEach((mon, i) => {
      const m = String(i + 1).padStart(2, '0')
      expect(displayDate(`2025-${m}-15`)).toBe(`15 ${mon} 2025`)
    })
  })
})
