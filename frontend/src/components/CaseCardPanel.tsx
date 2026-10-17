import { Check, Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { FIELD_LABELS, type CaseCard, type Post } from '@/lib/types'
import { cn } from '@/lib/utils'

/** 参与进度统计的六个字段——标题和现象发帖时必填，故不计入 */
const TRACKED: (keyof CaseCard)[] = [
  'ore_type',
  'process',
  'equipment',
  'conditions',
  'action',
  'result',
]

function display(field: keyof CaseCard, card: CaseCard): string {
  const v = card[field]
  if (Array.isArray(v)) return v.join('、')
  return (v as string) || ''
}

/**
 * 案例卡补全区 —— 本论坛区别于普通论坛的核心。
 *
 * 设计要点：缺失的字段以"可点击补充"的形式呈现，而不是空白。
 * 用户看到的是"还差什么"，而不是"要填一张表"。
 */
export function CaseCardPanel({
  post,
  onUpdated,
}: {
  post: Post
  onUpdated?: (p: Post) => void
}) {
  const [editing, setEditing] = useState<keyof CaseCard | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filled = TRACKED.filter((f) => display(f, post.card)).length
  const pct = Math.round((filled / TRACKED.length) * 100)

  async function save(field: keyof CaseCard) {
    const value = draft.trim()
    if (!value) {
      setEditing(null)
      return
    }
    setSaving(true)
    setError('')
    try {
      const patch: Partial<CaseCard> =
        field === 'diagnosis'
          ? { diagnosis: value.split(/[、,，]/).map((s) => s.trim()).filter(Boolean) }
          : field === 'tags'
            ? { tags: value.split(/[、,，]/).map((s) => s.trim()).filter(Boolean) }
            : { [field]: value }
      const updated = await api.patchCard(post.id, patch)
      onUpdated?.(updated)
      setEditing(null)
      setDraft('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">案例卡</h2>
        <span className="text-xs text-muted-foreground">
          {filled}/{TRACKED.length} 已填
        </span>
      </div>

      {/* 进度条：让"还差多少"一眼可见 */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            pct === 100 ? 'bg-primary' : 'bg-primary/60',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {post.status === 'closed'
          ? '这条案例已经闭环，可以汇进知识库了。'
          : '补全这些字段，这条讨论就会变成一条能被检索、能被 AI 学到的案例。'}
      </p>

      <dl className="mt-3 divide-y">
        {TRACKED.map((field) => {
          const value = display(field, post.card)
          const isEditing = editing === field
          return (
            <div key={field} className="py-2.5">
              <dt className="text-xs text-muted-foreground">
                {FIELD_LABELS[field]}
              </dt>

              {isEditing ? (
                <dd className="mt-1.5 space-y-2">
                  {field === 'conditions' || field === 'action' || field === 'result' ? (
                    <Textarea
                      autoFocus
                      rows={2}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`填写${FIELD_LABELS[field]}…`}
                    />
                  ) : (
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`填写${FIELD_LABELS[field]}…`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void save(field)
                        if (e.key === 'Escape') setEditing(null)
                      }}
                    />
                  )}
                  {error ? (
                    <p className="text-xs text-destructive">{error}</p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button size="sm" disabled={saving} onClick={() => void save(field)}>
                      {saving ? '保存中…' : '保存'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(null)
                        setError('')
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </dd>
              ) : value ? (
                <dd className="mt-0.5 flex items-start gap-1.5 text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{value}</span>
                </dd>
              ) : (
                <dd className="mt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(field)
                      setDraft('')
                    }}
                    className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    补充{FIELD_LABELS[field]}
                  </button>
                </dd>
              )}
            </div>
          )
        })}
      </dl>
    </section>
  )
}
