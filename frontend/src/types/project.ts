export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  domain: string
  status: 'active' | 'paused' | 'archived'
  owner_email: string
  logo: string | null
  members_count: number
  gsc_connected: boolean
  created_at: string
}

export interface ProjectDetail extends Project {
  owner: import('./auth').User
  settings: Record<string, unknown>
  project_settings: ProjectSettings
}

export interface ProjectSettings {
  gsc_connected: boolean
  gsc_site_url: string | null
  sync_frequency_hours: number
  last_sync_at: string | null
  notification_settings: Record<string, unknown>
}

export interface ProjectMember {
  id: string
  user: import('./auth').User
  role: 'manager' | 'analyst' | 'viewer'
  invited_by_email: string | null
  is_active: boolean
  created_at: string
}