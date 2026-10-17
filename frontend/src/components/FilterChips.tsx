import { cn } from '@/lib/utils'

/**
 * 手机上的筛选控件：横向滚动的胶囊按钮。
 * 比下拉框好按，也不占竖向空间。
 */
export function FilterChips({
  options,
  value,
  onChange,
  allLabel = '全部',
  showAll = true,
}: {
  options: readonly string[] | { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  allLabel?: string
  /** 排序这类"必有一个值"的场景不需要"全部"选项，否则会出现两个同名 chip */
  showAll?: boolean
}) {
  const items = [
    ...(showAll ? [{ value: '', label: allLabel }] : []),
    ...options.map((o) =>
      typeof o === 'string' ? { value: o, label: o } : o,
    ),
  ]

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((o) => (
        <button
          key={o.value || '__all'}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
            value === o.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:bg-accent',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
