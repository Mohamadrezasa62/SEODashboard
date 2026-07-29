export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug)
}

export function isValidPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  if (password.length < 8) errors.push('حداقل ۸ کاراکتر')
  if (!/[A-Z]/.test(password)) errors.push('حداقل یک حرف بزرگ')
  if (!/[a-z]/.test(password)) errors.push('حداقل یک حرف کوچک')
  if (!/\d/.test(password)) errors.push('حداقل یک عدد')
  return { valid: errors.length === 0, errors }
}

export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}