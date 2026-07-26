export interface SEOSummary {
  total_clicks: number
  total_impressions: number
  avg_ctr: number
  avg_position: number
  total_keywords: number
  total_pages: number
}

export interface TopKeyword {
  keyword__keyword: string
  total_clicks: number
  total_impressions: number
  avg_ctr: number
  avg_position: number
}

export interface TopPage {
  page__url: string
  total_clicks: number
  total_impressions: number
  avg_ctr: number
  avg_position: number
}

export interface DailyTrend {
  date: string
  total_clicks: number
  total_impressions: number
  avg_ctr: number
  avg_position: number
}

export interface DeviceBreakdown {
  device: string
  total_clicks: number
  total_impressions: number
  avg_ctr: number
  avg_position: number
}

export interface CountryBreakdown {
  country: string
  total_clicks: number
  total_impressions: number
}

export interface SEOFilters {
  date_from?: string
  date_to?: string
  device?: string
  country?: string
  keyword?: string
  page?: string
  limit?: number
  order_by?: string
}