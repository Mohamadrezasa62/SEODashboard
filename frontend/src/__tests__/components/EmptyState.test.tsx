import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '@/components/shared/EmptyState'
import { FolderOpen } from 'lucide-react'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={FolderOpen}
        title="پروژه‌ای وجود ندارد"
        description="اولین پروژه خود را ایجاد کنید"
      />
    )
    expect(screen.getByText('پروژه‌ای وجود ندارد')).toBeInTheDocument()
    expect(screen.getByText('اولین پروژه خود را ایجاد کنید')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const mockClick = jest.fn()
    render(
      <EmptyState
        icon={FolderOpen}
        title="خالی"
        action={{ label: 'ایجاد کن', onClick: mockClick }}
      />
    )
    const button = screen.getByText('ایجاد کن')
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('does not render action button when not provided', () => {
    render(
      <EmptyState
        icon={FolderOpen}
        title="خالی"
      />
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})