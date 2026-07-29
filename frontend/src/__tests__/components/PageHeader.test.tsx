import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="داشبورد" />)
    expect(screen.getByText('داشبورد')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<PageHeader title="داشبورد" description="توضیحات" />)
    expect(screen.getByText('توضیحات')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<PageHeader title="داشبورد" />)
    expect(screen.queryByText('توضیحات')).not.toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    render(
      <PageHeader
        title="داشبورد"
        actions={<Button>دکمه</Button>}
      />
    )
    expect(screen.getByText('دکمه')).toBeInTheDocument()
  })
})