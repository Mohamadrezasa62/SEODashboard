import { render, screen } from '@testing-library/react'
import { TrendChart } from '@/components/charts/TrendChart'
import type { DailyTrend } from '@/types/seo'

const mockData: DailyTrend[] = [
  { date: '2024-01-01', total_clicks: 100, total_impressions: 1000, avg_ctr: 0.1, avg_position: 5 },
  { date: '2024-01-02', total_clicks: 120, total_impressions: 1100, avg_ctr: 0.11, avg_position: 4.8 },
  { date: '2024-01-03', total_clicks: 90, total_impressions: 950, avg_ctr: 0.09, avg_position: 5.2 },
]

jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}))

describe('TrendChart', () => {
  it('renders chart with data', () => {
    render(<TrendChart data={mockData} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('shows empty message when no data', () => {
    render(<TrendChart data={[]} />)
    expect(screen.getByText('داده‌ای موجود نیست')).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = render(<TrendChart data={[]} loading />)
    expect(container.firstChild).toBeTruthy()
  })
})