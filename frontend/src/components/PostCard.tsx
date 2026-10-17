import { MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { relativeTime } from '@/lib/format'
import type { Post } from '@/lib/types'

export function PostCard({ post }: { post: Post }) {
  const cover = post.images[0]

  return (
    <Link
      to={`/posts/${post.id}`}
      className="block rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 active:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 font-semibold leading-snug">{post.title}</h3>
        <StatusBadge status={post.status} />
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
        {post.phenomenon}
      </p>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-14 w-20 shrink-0 rounded-md object-cover"
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          {post.card.ore_type ? (
            <Badge variant="secondary" className="font-normal">
              {post.card.ore_type}
            </Badge>
          ) : null}
          {post.card.process ? (
            <Badge variant="secondary" className="font-normal">
              {post.card.process}
            </Badge>
          ) : null}
          <span className="truncate">
            {post.author.nickname}
            {post.author.title ? ` · ${post.author.title}` : ''}
          </span>
          <span>·</span>
          <span>{relativeTime(post.created_at)}</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.reply_count}
          </span>
        </div>
      </div>
    </Link>
  )
}
