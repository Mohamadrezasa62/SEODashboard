import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export function LoadingSpinner({ size = 'md', className, text }: Props) {
  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizes[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text="در حال بارگذاری..." />
    </div>
  )
}