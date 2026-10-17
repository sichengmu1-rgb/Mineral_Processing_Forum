import { Badge } from '@/components/ui/badge'
import { STATUS_META, type CaseStatus } from '@/lib/types'

export function StatusBadge({ status }: { status: CaseStatus }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant={meta.variant} className="shrink-0">
      {status === 'closed' && '✓ '}
      {meta.label}
    </Badge>
  )
}
