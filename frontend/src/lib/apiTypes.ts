import type { CaseCard, Post } from './types'

export interface Meta {
  ore_types: string[]
  processes: string[]
  statuses: { value: string; label: string }[]
  current_user: { id: string; nickname: string; title: string | null }
}

export interface Stats {
  total_posts: number
  closed_cases: number
  closure_rate: number
  reply_rate: number
  field_fill_rate: number
  knowledge_chunks: number
}

export interface ListParams {
  q?: string
  ore_type?: string
  process?: string
  status?: string
  sort?: string
}

/** 导出的知识片段，对应需求文档 6.1 */
export interface Chunk {
  id: string
  source_type: 'case' | 'textbook' | 'paper'
  content: string
  structured: Record<string, unknown>
  provenance: string
  evidence_level: 'A' | 'B' | 'C'
  desensitized: boolean
}

export interface ListResult {
  items: Post[]
  total: number
}

/**
 * 数据访问的统一接口。
 *
 * 两个实现：
 *   remoteApi —— 打 Flask 后端（本地开发、自建部署）
 *   localApi  —— 全在浏览器内存里跑（GitHub Pages 静态演示）
 *
 * 页面只依赖这个接口，不关心背后是哪一个。
 */
export interface ForumApi {
  meta(): Promise<Meta>
  stats(): Promise<Stats>
  list(params?: ListParams): Promise<ListResult>
  get(id: string): Promise<Post>
  create(body: { title: string; phenomenon: string; images?: string[] }): Promise<Post>
  reply(id: string, content: string): Promise<Post>
  patchCard(id: string, patch: Partial<CaseCard>): Promise<Post>
  exportPreview(): Promise<{ chunks: Chunk[]; count: number }>
}
