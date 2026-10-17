import { Check, FileText, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/StatusBadge'
import { api, type Meta, type Stats } from '@/lib/api'
import { relativeTime } from '@/lib/format'
import type { Post } from '@/lib/types'

export function MePage() {
  const [mine, setMine] = useState<Post[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    void api.meta().then(setMeta).catch(() => {})
    void api.stats().then(setStats).catch(() => {})
    // Demo 里"我的"= 当前用户发的帖；接登录后换成按用户查
    api
      .list()
      .then((r) => setMine(r.items.filter((p) => p.author.id === 'me')))
      .catch(() => setMine([]))
  }, [])

  const answered = mine.reduce((n, p) => n + p.reply_count, 0)
  const closed = mine.filter((p) => p.status === 'closed').length

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {meta?.current_user.nickname.slice(0, 1) ?? '我'}
          </div>
          <div>
            <div className="font-semibold">
              {meta?.current_user.nickname ?? '我'}
            </div>
            <div className="text-xs text-muted-foreground">
              {meta?.current_user.title ?? '未认证身份 · 可自愿标注，不必实名'}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/60 py-2">
            <div className="flex items-center justify-center gap-1 text-lg font-semibold">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {mine.length}
            </div>
            <div className="text-xs text-muted-foreground">我的提问</div>
          </div>
          <div className="rounded-md bg-muted/60 py-2">
            <div className="flex items-center justify-center gap-1 text-lg font-semibold">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              {answered}
            </div>
            <div className="text-xs text-muted-foreground">收到回答</div>
          </div>
          <div className="rounded-md bg-muted/60 py-2">
            <div className="flex items-center justify-center gap-1 text-lg font-semibold text-primary">
              <Check className="h-4 w-4" />
              {closed}
            </div>
            <div className="text-xs text-muted-foreground">促成闭环</div>
          </div>
        </div>
      </div>

      {/* 使用资格：这是核心激励，放在个人页最显眼的位置 */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">你已获得数据集使用资格</p>
            <p className="mt-1 text-xs text-muted-foreground">
              在论坛注册并参与过讨论的人，可以使用导出的选矿知识数据集。
              目前知识库已有 {stats?.knowledge_chunks ?? 0} 条片段。
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          我的提问
        </h2>
        {mine.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            还没有提过问题
          </div>
        ) : (
          <div className="space-y-2">
            {mine.map((p) => (
              <Link
                key={p.id}
                to={`/posts/${p.id}`}
                className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3.5 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <div className="line-clamp-1 font-medium">{p.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {relativeTime(p.created_at)} · {p.reply_count} 条回答
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
