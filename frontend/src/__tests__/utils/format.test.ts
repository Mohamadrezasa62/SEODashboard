import {
  formatNumber,
  formatCTR,
  formatPosition,
  formatDate,
  formatFileSize,
  getInitials,
  truncate,
  getDomainFromUrl,
  getDateRange,
} from '@/lib/utils'

describe('formatNumber', () => {
  it('formats millions', () => {
    expect(formatNumber(1_500_000)).toBe('1.5M')
  })

  it('formats thousands', () => {
    expect(formatNumber(1_500)).toBe('1.5K')
  })

  it('formats small numbers', () => {
    expect(formatNumber(500)).toBe('500')
  })

  it('returns dash for null', () => {
    expect(formatNumber(null)).toBe('—')
  })

  it('returns dash for undefined', () => {
    expect(formatNumber(undefined)).toBe('—')
  })
})

describe('formatCTR', () => {
  it('formats ctr as percentage', () => {
    expect(formatCTR(0.1234)).toBe('12.34%')
  })

  it('returns dash for null', () => {
    expect(formatCTR(null)).toBe('—')
  })
})

describe('formatPosition', () => {
  it('formats position with one decimal', () => {
    expect(formatPosition(5.678)).toBe('5.7')
  })

  it('returns dash for null', () => {
    expect(formatPosition(null)).toBe('—')
  })
})

describe('formatFileSize', () => {
  it('formats MB', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('formats KB', () => {
    expect(formatFileSize(512)).toBe('0.5 KB')
  })

  it('returns dash for null', () => {
    expect(formatFileSize(null)).toBe('—')
  })
})

describe('getInitials', () => {
  it('gets initials from full name', () => {
    expect(getInitials('Ali Mohammadi')).toBe('AM')
  })

  it('gets single initial', () => {
    expect(getInitials('Ali')).toBe('A')
  })
})

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...')
  })

  it('does not truncate short strings', () => {
    expect(truncate('Hi', 5)).toBe('Hi')
  })
})

describe('getDomainFromUrl', () => {
  it('extracts domain from URL', () => {
    expect(getDomainFromUrl('https://example.com/page')).toBe('example.com')
  })

  it('returns original for invalid URL', () => {
    expect(getDomainFromUrl('not-a-url')).toBe('not-a-url')
  })
})

describe('getDateRange', () => {
  it('returns correct range for 28 days', () => {
    const { date_from, date_to } = getDateRange(28)
    const from = new Date(date_from)
    const to = new Date(date_to)
    const diff = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
    expect(diff).toBe(27)
  })

  it('returns strings in ISO format', () => {
    const { date_from, date_to } = getDateRange(7)
    expect(date_from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(date_to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})