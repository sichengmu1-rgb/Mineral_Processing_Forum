import { Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { FilterChips } from '@/components/FilterChips'
import { PostCard } from '@/components/PostCard'
import { Input } from '@/components/ui/input'
import { api, type ListParams, type Meta, type Stats } from '@/lib/api'
import type { Post } from '@/lib/types'

export function ListPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [ore, setOre] = useState('')
  const [proc, setProc] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('new')

  // 输入框抖动收敛，避免每敲一个字就发一次请求
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    void api.meta().then(setMeta).catch(() => {})
    void api.stats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    const params: ListParams = {
      q: debouncedQ,
      ore_type: ore,
      process: proc,
      status,
      sort,
    }
    setLoading(true)
    api
      .list(params)
      .then((r) => setPosts(r.items))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [debouncedQ, ore, proc, status, sort])

  const sortOptions = useMemo(
    () => [
      { value: 'new', label: '最新' },
      { value: 'active', label: '讨论最多' },
      { value: 'closed', label: '已闭环优先' },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      {/* 顶部：一句话说清这个论坛是干什么的，新访客进来不会懵 */}
      <div className="rounded-lg border bg-card p-4">
        <h1 className="text-lg font-semibold">把现场问题变成能用的经验</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          发问题时只要写清楚现象、拍张照就行。大家一起补充工况和处置结果，
          这条讨论就会变成一条结构化的案例，汇进公开的选矿知识库。
        </p>

        {stats ? (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/60 py-2">
              <div className="text-lg font-semibold">{stats.total_posts}</div>
              <div className="text-xs text-muted-foreground">讨论</div>
            </div>
            <div className="rounded-md bg-muted/60 py-2">
              <div className="text-lg font-semibold text-primary">
                {stats.closed_cases}
              </div>
              <div className="text-xs text-muted-foreground">已闭环案例</div>
            </div>
            <div className="rounded-md bg-muted/60 py-2">
              <div className="text-lg font-semibold">
                {Math.round(stats.closure_rate * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">闭环率</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜问题，比如：冒槽、泡沫变黏、旋流器"
          className="pl-9"
        />
      </div>

      {meta ? (
        <div className="space-y-2">
          <FilterChips options={meta.ore_types} value={ore} onChange={setOre} allLabel="全部矿种" />
          <FilterChips options={meta.processes} value={proc} onChange={setProc} allLabel="全部工序" />
          <FilterChips options={meta.statuses} value={status} onChange={setStatus} allLabel="全部状态" />
          <FilterChips options={sortOptions} value={sort} onChange={setSort} showAll={false} />
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          没有找到相关讨论
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
