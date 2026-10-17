import { BookOpen, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { FilterChips } from '@/components/FilterChips'
import { Badge } from '@/components/ui/badge'
import { api, type Meta } from '@/lib/api'
import { relativeTime } from '@/lib/format'
import type { Post } from '@/lib/types'

/**
 * 案例库：只看已闭环的案例。
 *
 * 和首页的区别在于，这里展示的是**结构化之后的形态**——
 * 工况、诊断、处置、结果都摊开，因为它已经是可以直接用的经验，
 * 而不是一条还在讨论中的帖子。
 */
export function CasesPage() {
  const [cases, setCases] = useState<Post[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [ore, setOre] = useState('')
  const [proc, setProc] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void api.meta().then(setMeta).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api
      .list({ status: 'closed', ore_type: ore, process: proc })
      .then((r) => setCases(r.items))
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [ore, proc])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">案例库</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          这些讨论已经走到了结论——有处置、有结果。它们会被脱敏后导出成知识片段，
          汇进公开的选矿知识库。
        </p>
      </div>

      {meta ? (
        <div className="space-y-2">
          <FilterChips options={meta.ore_types} value={ore} onChange={setOre} allLabel="全部矿种" />
          <FilterChips options={meta.processes} value={proc} onChange={setProc} allLabel="全部工序" />
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          还没有符合筛选条件的闭环案例
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {cases.map((c) => (
            <Link
              key={c.id}
              to={`/posts/${c.id}`}
              className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <h3 className="line-clamp-2 font-semibold leading-snug">{c.title}</h3>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.card.ore_type ? (
                  <Badge variant="secondary" className="font-normal">
                    {c.card.ore_type}
                  </Badge>
                ) : null}
                {c.card.process ? (
                  <Badge variant="secondary" className="font-normal">
                    {c.card.process}
                  </Badge>
                ) : null}
                {c.card.tags?.slice(0, 2).map((t) => (
                  <Badge key={t} variant="outline" className="font-normal">
                    {t}
                  </Badge>
                ))}
              </div>

              <dl className="mt-3 space-y-1.5 text-xs">
                {c.card.action ? (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-muted-foreground">处置</dt>
                    <dd className="line-clamp-2">{c.card.action}</dd>
                  </div>
                ) : null}
                {c.card.result ? (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-muted-foreground">结果</dt>
                    <dd className="line-clamp-2 text-primary">{c.card.result}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-3 text-xs text-muted-foreground">
                {c.author.nickname}
                {c.author.title ? ` · ${c.author.title}` : ''} ·{' '}
                {relativeTime(c.created_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
