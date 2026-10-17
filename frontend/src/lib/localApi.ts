/**
 * 纯前端的"假后端"，供 GitHub Pages 静态演示使用。
 *
 * 数据和逻辑与 backend/db.py 保持一致：同样的初始数据、同样的状态机、
 * 同样的导出格式。区别只有一个——数据存在浏览器内存里，刷新即重置。
 * 这样访问者不用装任何东西就能把整条主路径点一遍。
 */

import seed from './seed.json'
import type { Chunk, ForumApi, ListParams, ListResult, Meta, Stats } from './apiTypes'
import type { Author, CaseCard, CaseStatus, Post } from './types'

const TRACKED: (keyof CaseCard)[] = [
  'ore_type',
  'process',
  'equipment',
  'conditions',
  'action',
  'result',
]

/** 与 db.py 的 derive_status 一致 */
function deriveStatus(p: Post): CaseStatus {
  if (p.card.action && p.card.result) return 'closed'
  if (p.card.ore_type || p.card.process || p.card.equipment) return 'partial'
  return 'published'
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

/** 内存中的"库"。刷新页面即回到初始状态。 */
let posts: Post[] = clone(seed.posts) as Post[]
let nextId = 1

function uid() {
  return `local${(nextId++).toString(36).padStart(4, '0')}`
}

function nowIso() {
  return new Date().toISOString().slice(0, 19)
}

const META = seed.meta as Meta

/** seed 里 title 是 null，而 Author.title 是可选的，统一成 undefined */
const ME: Author = {
  id: META.current_user.id,
  nickname: META.current_user.nickname,
  title: META.current_user.title ?? undefined,
}

/** 案例卡里这些字段是单行文本，这些是字符串数组 */
const TEXT_FIELDS = [
  'ore_type',
  'process',
  'equipment',
  'conditions',
  'action',
  'result',
] as const
const LIST_FIELDS = ['diagnosis', 'tags'] as const

function withStatus(p: Post): Post {
  return { ...p, status: deriveStatus(p), reply_count: p.replies.length }
}

function findAll(params: ListParams = {}): Post[] {
  const { q = '', ore_type = '', process: proc = '', status = '', sort = 'new' } = params
  let items = posts.map(withStatus)

  if (q) {
    const needle = q.toLowerCase()
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.phenomenon.toLowerCase().includes(needle),
    )
  }
  if (ore_type) items = items.filter((p) => p.card.ore_type === ore_type)
  if (proc) items = items.filter((p) => p.card.process === proc)
  if (status) items = items.filter((p) => p.status === status)

  if (sort === 'active') {
    items.sort(
      (a, b) => b.reply_count - a.reply_count || b.created_at.localeCompare(a.created_at),
    )
  } else if (sort === 'closed') {
    items.sort((a, b) => {
      const d = Number(b.status === 'closed') - Number(a.status === 'closed')
      return d || b.created_at.localeCompare(a.created_at)
    })
  } else {
    items.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  return items
}

export const localApi: ForumApi = {
  meta: async () => META,

  list: async (params: ListParams = {}): Promise<ListResult> => {
    const items = findAll(params)
    return { items, total: items.length }
  },

  get: async (id: string) => {
    const p = posts.find((x) => x.id === id)
    if (!p) throw new Error('not found')
    return withStatus(p)
  },

  create: async ({ title, phenomenon, images = [] }) => {
    const t = title.trim()
    const ph = phenomenon.trim()
    if (!t) throw new Error('标题不能为空')
    if (!ph) throw new Error('请描述一下现象')

    const post: Post = {
      id: uid(),
      title: t,
      phenomenon: ph,
      images,
      author: { ...ME },
      created_at: nowIso(),
      status: 'published',
      card: {},
      replies: [],
      reply_count: 0,
    }
    posts = [post, ...posts]
    return withStatus(post)
  },

  reply: async (id: string, content: string) => {
    const c = content.trim()
    if (!c) throw new Error('回答不能为空')
    const p = posts.find((x) => x.id === id)
    if (!p) throw new Error('not found')

    p.replies.push({
      id: uid(),
      author: { ...ME },
      content: c,
      created_at: nowIso(),
    })
    return withStatus(p)
  },

  patchCard: async (id: string, patch: Partial<CaseCard>) => {
    const p = posts.find((x) => x.id === id)
    if (!p) throw new Error('not found')

    const next: CaseCard = { ...p.card }

    for (const k of TEXT_FIELDS) {
      if (!(k in patch)) continue
      const raw = patch[k]
      const s = typeof raw === 'string' ? raw.trim() : ''
      if (s) next[k] = s
      else delete next[k]
    }

    for (const k of LIST_FIELDS) {
      if (!(k in patch)) continue
      const raw = patch[k]
      const arr = Array.isArray(raw)
        ? raw.filter((x) => typeof x === 'string' && x.trim())
        : []
      if (arr.length) next[k] = arr
      else delete next[k]
    }

    p.card = next
    return withStatus(p)
  },

  exportPreview: async () => {
    const chunks: Chunk[] = posts
      .map(withStatus)
      .filter((p) => p.status === 'closed')
      .map((p) => {
        const c = p.card
        const parts = [
          p.phenomenon,
          c.diagnosis?.length ? `诊断：${c.diagnosis.join('、')}` : '',
          c.action ? `处置：${c.action}` : '',
          c.result ? `结果：${c.result}` : '',
        ].filter(Boolean)

        return {
          id: `case:${p.id}`,
          source_type: 'case' as const,
          content: parts.join('；'),
          structured: c as unknown as Record<string, unknown>,
          provenance: `/posts/${p.id}`,
          evidence_level: 'B' as const,
          desensitized: true,
        }
      })
    return { chunks, count: chunks.length }
  },

  stats: async (): Promise<Stats> => {
    const items = posts.map(withStatus)
    const total = items.length
    const closed = items.filter((p) => p.status === 'closed').length
    const replied = items.filter((p) => p.reply_count > 0).length

    let filled = 0
    for (const p of items) {
      for (const f of TRACKED) if (p.card[f]) filled++
    }

    return {
      total_posts: total,
      closed_cases: closed,
      closure_rate: total ? Number((closed / total).toFixed(3)) : 0,
      reply_rate: total ? Number((replied / total).toFixed(3)) : 0,
      field_fill_rate: total ? Number((filled / (total * 6)).toFixed(3)) : 0,
      knowledge_chunks: closed * 3,
    }
  },
}
