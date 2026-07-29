import { isValidEmail, isValidUrl, isValidSlug, isValidPassword } from '@/lib/utils/validation'

describe('isValidEmail', () => {
  it('validates correct email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
  })
})

describe('isValidUrl', () => {
  it('validates https URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
  })

  it('validates http URL', () => {
    expect(isValidUrl('http://example.com/path?q=1')).toBe(true)
  })

  it('rejects invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false)
    expect(isValidUrl('example.com')).toBe(false)
  })
})

describe('isValidSlug', () => {
  it('validates correct slug', () => {
    expect(isValidSlug('my-slug-123')).toBe(true)
    expect(isValidSlug('test')).toBe(true)
  })

  it('rejects invalid slug', () => {
    expect(isValidSlug('My Slug')).toBe(false)
    expect(isValidSlug('slug_with_underscore')).toBe(false)
    expect(isValidSlug('UPPERCASE')).toBe(false)
  })
})

describe('isValidPassword', () => {
  it('validates strong password', () => {
    const result = isValidPassword('Test1234!')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects short password', () => {
    const result = isValidPassword('Ab1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('حداقل ۸ کاراکتر')
  })

  it('rejects password without uppercase', () => {
    const result = isValidPassword('test1234!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('حداقل یک حرف بزرگ')
  })

  it('rejects password without number', () => {
    const result = isValidPassword('TestPassword!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('حداقل یک عدد')
  })
})