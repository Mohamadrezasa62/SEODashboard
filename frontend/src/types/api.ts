export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  success: boolean
  count: number
  total_pages: number
  current_page: number
  next: string | null
  previous: string | null
  data: T[]
}

export interface ApiError {
  success: false
  message: string
  errors: Record<string, string[]> | null
}