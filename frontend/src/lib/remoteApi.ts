import type { CaseCard, Post } from './types'
import type { Chunk, ForumApi, ListParams, ListResult, Meta, Stats } from './apiTypes'

/** 开发期走 Vite 代理（见 vite.config.ts），因此这里只用相对路径 */
const BASE = '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `请求失败（${res.status}）`)
  }
  return res.json() as Promise<T>
}

export const remoteApi: ForumApi = {
  meta: () => req<Meta>('/meta'),

  stats: () => req<Stats>('/stats'),

  list: (params: ListParams = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][],
    ).toString()
    return req<ListResult>(`/posts${qs ? `?${qs}` : ''}`)
  },

  get: (id: string) => req<Post>(`/posts/${id}`),

  create: (body: { title: string; phenomenon: string; images?: string[] }) =>
    req<Post>('/posts', { method: 'POST', body: JSON.stringify(body) }),

  reply: (id: string, content: string) =>
    req<Post>(`/posts/${id}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  patchCard: (id: string, patch: Partial<CaseCard>) =>
    req<Post>(`/posts/${id}/card`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  exportPreview: () =>
    req<{ chunks: Chunk[]; count: number }>('/export/preview'),
}
