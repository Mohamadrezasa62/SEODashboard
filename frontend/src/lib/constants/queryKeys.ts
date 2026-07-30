export const QUERY_KEYS = {
  ME: ['me'],

  PROJECTS: ['projects'],
  PROJECT: (id: string) => ['projects', id],
  PROJECT_MEMBERS: (id: string) => ['projects', id, 'members'],

  SEO_SUMMARY: (projectId: string) => ['seo', projectId, 'summary'],
  SEO_KEYWORDS: (projectId: string) => ['seo', projectId, 'keywords'],
  SEO_PAGES: (projectId: string) => ['seo', projectId, 'pages'],
  SEO_TREND: (projectId: string) => ['seo', projectId, 'trend'],
  SEO_DEVICES: (projectId: string) => ['seo', projectId, 'devices'],
  SEO_COUNTRIES: (projectId: string) => ['seo', projectId, 'countries'],

  FEEDBACK_THREADS: (projectId: string) => ['feedback', projectId, 'threads'],
  FEEDBACK_COMMENTS: (threadId: string) => ['feedback', 'comments', threadId],

  KPIS: (projectId: string) => ['kpi', projectId],
  KPI_RECORDS: (kpiId: string) => ['kpi-records', kpiId],
  KPI_ALERTS: (projectId: string) => ['kpi-alerts', projectId],

  DASHBOARDS: ['dashboards'],
  DASHBOARD: (id: string) => ['dashboard', id],

  REPORTS: (projectId: string) => ['reports', projectId],
  SCHEDULED_REPORTS: (projectId: string) => ['scheduled-reports', projectId],

  NOTIFICATIONS: ['notifications'],
  UNREAD_COUNT: ['notifications', 'unread-count'],

  AI_PROVIDERS: ['ai-providers'],
  AI_USAGE: ['ai-usage'],

  USERS: ['users'],
  ROLES: ['roles'],
  PERMISSIONS: ['permissions'],
  FEATURE_FLAGS: ['feature-flags'],
  PLUGINS: ['plugins'],

  BACKUPS: ['backups'],
  RESTORES: ['restores'],

  HEALTH: ['health'],
  SYSTEM_STATS: ['system-stats'],
  AUDIT_LOGS: ['audit-logs'],
  TASK_LOGS: ['task-logs'],
  TASK_STATS: ['task-stats'],
  PERIODIC_TASKS: ['periodic-tasks'],
} as const