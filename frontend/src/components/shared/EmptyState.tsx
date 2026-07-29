import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 text-center text-muted-foreground',
      className
    )}>
      <Icon className="w-14 h-14 mb-4 opacity-20" />
      <h3 className="text-base font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm max-w-xs mb-4">{description}</p>
      )}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}