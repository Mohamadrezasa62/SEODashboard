import {
  formatBytes,
  formatDuration,
  formatPercentage,
  formatRelativeTime,
  clampNumber,
  roundToDecimals,
} from '@/lib/utils/format'

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB')
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB')
  })

  it('respects decimal places', () => {
    expect(formatBytes(1536, 1)).toBe('1.5 KB')
  })
})

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(45)).toBe('45s')
  })

  it('formats minutes', () => {
    expect(formatDuration(90)).toBe('1m 30s')
  })

  it('formats hours', () => {
    expect(formatDuration(3661)).toBe('1h 1m')
  })
})

describe('formatPercentage', () => {
  it('calculates percentage', () => {
    expect(formatPercentage(25, 100)).toBe('25.0%')
    expect(formatPercentage(1, 3, 2)).toBe('33.33%')
  })

  it('handles zero total', () => {
    expect(formatPercentage(5, 0)).toBe('0%')
  })
})

describe('clampNumber', () => {
  it('clamps within range', () => {
    expect(clampNumber(5, 0, 10)).toBe(5)
    expect(clampNumber(-1, 0, 10)).toBe(0)
    expect(clampNumber(15, 0, 10)).toBe(10)
  })
})

describe('roundToDecimals', () => {
  it('rounds correctly', () => {
    expect(roundToDecimals(1.2345, 2)).toBe(1.23)
    expect(roundToDecimals(1.005, 2)).toBe(1.01)
  })
})