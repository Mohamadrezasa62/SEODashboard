import { render, screen } from '@testing-library/react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { MousePointerClick } from 'lucide-react'

describe('MetricCard', () => {
  it('renders title correctly', () => {
    render(
      <MetricCard
        title="کل کلیک‌ها"
        value={1500}
        icon={MousePointerClick}
        color="blue"
      />
    )
    expect(screen.getByText('کل کلیک‌ها')).toBeInTheDocument()
  })

  it('formats number value correctly', () => {
    render(
      <MetricCard
        title="کلیک"
        value={1500}
        icon={MousePointerClick}
        color="blue"
      />
    )
    expect(screen.getByText('1.5K')).toBeInTheDocument()
  })

  it('formats CTR correctly', () => {
    render(
      <MetricCard
        title="CTR"
        value={0.1234}
        format="ctr"
        icon={MousePointerClick}
        color="green"
      />
    )
    expect(screen.getByText('12.34%')).toBeInTheDocument()
  })

  it('shows dash for null value', () => {
    render(
      <MetricCard
        title="رتبه"
        value={null}
        icon={MousePointerClick}
        color="orange"
      />
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = render(
      <MetricCard
        title="کلیک"
        value={100}
        icon={MousePointerClick}
        color="blue"
        loading={true}
      />
    )
    expect(container.querySelector('[class*="animate"]')).toBeTruthy()
  })
})