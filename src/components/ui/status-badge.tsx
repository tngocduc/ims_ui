import { cn } from '@/lib/utils'

type Status = 'pass' | 'fail' | 'error' | 'running' | 'needs_review' | 'pending'

const statusColors: Record<Status, string> = {
  pass: 'bg-status-pass/10 text-status-pass border-status-pass/20',
  fail: 'bg-status-fail/10 text-status-fail border-status-fail/20',
  error: 'bg-status-error/10 text-status-error border-status-error/20',
  running: 'bg-status-running/10 text-status-running border-status-running/20',
  needs_review: 'bg-status-review/10 text-status-review border-status-review/20',
  pending: 'bg-status-warning/10 text-status-warning border-status-warning/20',
}

interface StatusBadgeProps {
  status: Status
  className?: string
  showDot?: boolean
  label?: string
}

export function StatusBadge({ status, className, showDot = true, label }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-medium rounded-[4px] border',
      statusColors[status],
      className
    )}>
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', statusColors[status].replace('bg-', 'bg-').replace('text-', 'bg-'))} />
      )}
      {label || status}
    </span>
  )
}