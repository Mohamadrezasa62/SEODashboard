import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  AlertDialogAction: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}))

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'تأیید حذف',
    description: 'آیا مطمئن هستید؟',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => jest.clearAllMocks())

  it('renders title and description', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('تأیید حذف')).toBeInTheDocument()
    expect(screen.getByText('آیا مطمئن هستید؟')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="حذف" />)
    fireEvent.click(screen.getByText('حذف'))
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button clicked', () => {
    render(<ConfirmDialog {...defaultProps} cancelLabel="انصراف" />)
    fireEvent.click(screen.getByText('انصراف'))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('تأیید حذف')).not.toBeInTheDocument()
  })
})