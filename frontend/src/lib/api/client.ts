import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: Array<(token: string) => void> = []

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                resolve(this.client(originalRequest))
              })
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const refreshToken = Cookies.get('refresh_token')
            if (!refreshToken) {
              this.handleLogout()
              return Promise.reject(error)
            }

            const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
              refresh: refreshToken,
            })

            const { access, refresh } = response.data.data
            Cookies.set('access_token', access, { expires: 1 })
            Cookies.set('refresh_token', refresh, { expires: 7 })

            this.refreshSubscribers.forEach((cb) => cb(access))
            this.refreshSubscribers = []

            originalRequest.headers.Authorization = `Bearer ${access}`
            return this.client(originalRequest)
          } catch {
            this.handleLogout()
            return Promise.reject(error)
          } finally {
            this.isRefreshing = false
          }
        }

        if (error.response?.status === 403) {
          toast.error('دسترسی مجاز نیست')
        }

        if (error.response?.status >= 500) {
          toast.error('خطای سرور. لطفاً دوباره تلاش کنید.')
        }

        return Promise.reject(error)
      }
    )
  }

  private handleLogout() {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config)
    return response.data
  }

  async uploadFile<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

export const apiClient = new ApiClient()