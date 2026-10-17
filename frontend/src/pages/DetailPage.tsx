import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { CaseCardPanel } from '@/components/CaseCardPanel'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { relativeTime } from '@/lib/format'
import type { Post } from '@/lib/types'

export function DetailPage() {
  const { id = '' } = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setLoading(true)
    api
      .get(id)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [id])

  async function send() {
    const content = reply.trim()
    if (!content || !post) return
    setSending(true)
    try {
      const updated = await api.reply(post.id, content)
      setPost(updated)
      setReply('')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        这条讨论不存在
        <div className="mt-3">
          <Button variant="outline" asChild>
            <Link to="/">返回列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </Link>

      {/* 手机上案例卡放在正文之后、回答之前；桌面端移到右侧栏 */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <article className="rounded-lg border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-lg font-semibold leading-snug sm:text-xl">
                {post.title}
              </h1>
              <StatusBadge status={post.status} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {post.author.nickname}
              </span>
              {post.author.title ? <span>· {post.author.title}</span> : null}
              <span>·</span>
              <span>{relativeTime(post.created_at)}</span>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
              {post.phenomenon}
            </p>

            {post.images.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {post.images.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img
                      src={src}
                      alt={`现场照片 ${i + 1}`}
                      loading="lazy"
                      className="aspect-[4/3] w-full rounded-md border object-cover"
                    />
                  </a>
                ))}
              </div>
            ) : null}
          </article>

          {/* 桌面端隐藏 */}
          <div className="lg:hidden">
            <CaseCardPanel post={post} onUpdated={setPost} />
          </div>

          <section className="rounded-lg border bg-card p-4 sm:p-5">
            <h2 className="font-semibold">
              {post.reply_count > 0 ? `${post.reply_count} 条回答` : '还没有人回答'}
            </h2>

            <div className="mt-3 space-y-4">
              {post.replies.map((r) => (
                <div key={r.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                    {r.author.nickname.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {r.author.nickname}
                      </span>
                      {r.author.title ? <span>· {r.author.title}</span> : null}
                      <span>·</span>
                      <span>{relativeTime(r.created_at)}</span>
                      {r.accepted ? (
                        <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                          <Check className="h-3 w-3" />
                          提问者采纳
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {r.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <Textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="说说你的判断。如果是原因，写清楚依据——这些会被标进案例卡的「诊断」字段。"
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={() => void send()} disabled={sending || !reply.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                回答
              </Button>
            </div>
          </section>
        </div>

        {/* 桌面端右侧栏：案例卡常驻可见 */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <CaseCardPanel post={post} onUpdated={setPost} />

            <div className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">这条数据会去哪</p>
              <p className="mt-1.5 leading-relaxed">
                闭环后的案例会脱敏、导出为知识片段，以开源许可公开。
                参与过讨论的人都可以使用这份数据集。
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
