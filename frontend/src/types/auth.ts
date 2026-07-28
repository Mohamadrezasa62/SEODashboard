export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: 'developer' | 'company_manager' | 'employee'
  avatar: string | null
  phone: string | null
  bio: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  profile: UserProfile | null
}


export interface UserProfile {
  timezone: string
  language: string
  theme: 'light' | 'dark' | 'system'
  notification_email: boolean
  notification_in_app: boolean
}


export interface AuthTokens {
  access: string
  refresh: string
}


export interface LoginResponse {
  access: string
  refresh: string
}


export interface LoginRequest {
  email: string
  password: string
}


export interface RegisterRequest {
  email: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
}