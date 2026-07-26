export const APP_NAME = 'SEO Dashboard'

export const ROLES = {
  DEVELOPER: 'developer',
  COMPANY_MANAGER: 'company_manager',
  EMPLOYEE: 'employee',
} as const

export const ROLE_LABELS: Record<string, string> = {
  developer: 'توسعه‌دهنده',
  company_manager: 'مدیر شرکت',
  employee: 'کارمند',
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'فعال',
  paused: 'متوقف',
  archived: 'آرشیو',
  open: 'باز',
  in_progress: 'در حال بررسی',
  resolved: 'حل‌شده',
  closed: 'بسته',
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-500',
  paused: 'text-yellow-500',
  archived: 'text-gray-500',
  open: 'text-blue-500',
  in_progress: 'text-yellow-500',
  resolved: 'text-green-500',
  closed: 'text-gray-500',
}

export const DATE_RANGES = [
  { label: '۷ روز گذشته', value: 7 },
  { label: '۲۸ روز گذشته', value: 28 },
  { label: '۳ ماه گذشته', value: 90 },
  { label: '۶ ماه گذشته', value: 180 },
  { label: '۱ سال گذشته', value: 365 },
]

export const QUERY_KEYS = {
  ME: ['me'],
  PROJECTS: ['projects'],
  PROJECT: (id: string) => ['projects', id],
  PROJECT_MEMBERS: (id: string) => ['projects', id, 'members'],
  SEO_SUMMARY: (projectId: string) => ['seo', projectId, 'summary'],
  SEO_KEYWORDS: (projectId: string) => ['seo', projectId, 'keywords'],
  SEO_PAGES: (projectId: string) => ['seo', projectId, 'pages'],
  SEO_TREND: (projectId: string) => ['seo', projectId, 'trend'],
  NOTIFICATIONS: ['notifications'],
  UNREAD_COUNT: ['notifications', 'unread-count'],
  FEEDBACK_THREADS: (projectId: string) => ['feedback', projectId, 'threads'],
  KPIS: (projectId: string) => ['kpi', projectId],
  DASHBOARDS: ['dashboards'],
} as const