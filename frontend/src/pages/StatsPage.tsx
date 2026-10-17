import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { api, type Stats } from '@/lib/api'

interface Chunk {
  id: string
  source_type: string
  content: string
  structured: Record<string, unknown>
  provenance: string
  evidence_level: 'A' | 'B' | 'C'
  desensitized: boolean
}

const LEVEL_DESC: Record<string, string> = {
  A: '教材、论文（同行检验）',
  B: '已闭环案例（有处置、有结果）',
  C: '未闭环讨论（仅推测）',
}

export function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.stats(), api.exportPreview()])
      .then(([s, e]) => {
        setStats(s)
        setChunks(e.chunks as Chunk[])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  const metrics = stats
    ? [
        { label: '闭环案例数', value: stats.closed_cases, hint: '核心指标', primary: true },
        { label: '闭环率', value: `${Math.round(stats.closure_rate * 100)}%`, hint: '闭环 / 总帖' },
        { label: '回答率', value: `${Math.round(stats.reply_rate * 100)}%`, hint: '有人答的帖子占比' },
        { label: '字段填充率', value: `${Math.round(stats.field_fill_rate * 100)}%`, hint: '案例卡完整度' },
        { label: '知识片段', value: stats.knowledge_chunks, hint: '已可入库' },
        { label: '讨论总数', value: stats.total_posts, hint: '不作为考核指标' },
      ]
    : []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">数据看板</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          按《论坛需求文档》第 11 节的口径。真正的产出是闭环案例，
          不是发帖数——所以注册数和帖子总数都不作为考核指标。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`rounded-lg border p-3 ${m.primary ? 'border-primary/40 bg-primary/5' : 'bg-card'}`}
          >
            <div className={`text-2xl font-semibold ${m.primary ? 'text-primary' : ''}`}>
              {m.value}
            </div>
            <div className="mt-0.5 text-sm">{m.label}</div>
            <div className="text-xs text-muted-foreground">{m.hint}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-2 font-semibold">论坛数据 → 知识库片段</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          闭环案例会按统一格式导出，和教材、论文的片段合到同一个知识库里。
          检索时不再区分来源，只在回答里标注出处和证据等级。
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          {Object.entries(LEVEL_DESC).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs"
            >
              <Badge variant={k === 'B' ? 'done' : 'secondary'}>{k}</Badge>
              <span className="text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>

        {chunks.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            还没有已闭环的案例可以导出
          </div>
        ) : (
          <div className="space-y-3">
            {chunks.slice(0, 4).map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <code className="rounded bg-muted px-1.5 py-0.5">{c.id}</code>
                  <Badge variant="secondary">{c.source_type}</Badge>
                  <Badge variant="done">等级 {c.evidence_level}</Badge>
                  {c.desensitized ? (
                    <Badge variant="outline">已脱敏</Badge>
                  ) : null}
                </div>
                <p className="mt-2.5 text-sm leading-relaxed">{c.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  出处：{c.provenance}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
