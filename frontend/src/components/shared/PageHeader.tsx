import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: Props) {
  return (
    <div className={cn('flex items-start justify-between flex-wrap gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}