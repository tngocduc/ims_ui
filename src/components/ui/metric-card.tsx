import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'

interface MetricCardProps {
  value: number | string
  label: string
  trend?: { value: number; label: string }
  className?: string
}

export function MetricCard({ value, label, trend, className }: MetricCardProps) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value
  
  return (
    <div className={cn(
      'p-4 bg-bg-surface border border-border-subtle rounded-[4px]',
      className
    )}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-mono font-medium text-text-primary tracking-tight">
            {displayValue}
          </p>
          <p className="text-xs text-text-muted mt-1">{label}</p>
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-[4px]',
            trend.value >= 0 
              ? 'bg-status-pass/10 text-status-pass' 
              : 'bg-status-fail/10 text-status-fail'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            <span className="text-text-muted ml-1">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}