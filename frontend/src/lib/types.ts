/**
 * 领域类型定义。
 *
 * 字段与《论坛需求文档》第 5.2 节的"案例卡"一一对应，
 * 案例状态机也与第 5.3 节一致。
 */

/** 案例状态机：已发布 → 部分结构化 → 已闭环 → 已入库 */
export type CaseStatus = 'published' | 'partial' | 'closed' | 'archived'

/** 证据等级（需求文档 6.2）：A 教材论文 / B 已闭环案例 / C 未闭环讨论 */
export type EvidenceLevel = 'A' | 'B' | 'C'

export interface Author {
  id: string
  nickname: string
  /** 可选认证身份，不点名，例如"某铜矿浮选工" */
  title?: string
}

export interface CaseCard {
  ore_type?: string
  process?: string
  equipment?: string
  conditions?: string
  diagnosis?: string[]
  action?: string
  result?: string
  tags?: string[]
}

export interface Reply {
  id: string
  author: Author
  content: string
  created_at: string
  /** 是否为提问者采纳的答案 */
  accepted?: boolean
}

export interface Post {
  id: string
  title: string
  phenomenon: string
  images: string[]
  author: Author
  created_at: string
  status: CaseStatus
  card: CaseCard
  replies: Reply[]
  reply_count: number
}

/** 补全案例卡的一个字段时，记录是谁在什么时候补的（需求文档 7.3） */
export interface FieldLog {
  field: string
  value: string
  by: string
  at: string
}

export const ORE_TYPES = ['铜', '钼', '铅锌', '金', '铁', '煤', '磷', '钨锡'] as const

export const PROCESSES = [
  '粗选',
  '精选',
  '扫选',
  '磨矿',
  '分级',
  '脱水',
  '其他',
] as const

export const PHENOMENA = [
  '冒槽 / 跑槽',
  '指标下降',
  '泡沫异常',
  '旋流器不稳',
  '药剂问题',
  '设备故障',
] as const

/** 状态 → 界面文案与样式 */
export const STATUS_META: Record<
  CaseStatus,
  { label: string; variant: 'todo' | 'secondary' | 'done' | 'default' }
> = {
  published: { label: '待补全', variant: 'todo' },
  partial: { label: '部分结构化', variant: 'secondary' },
  closed: { label: '已闭环', variant: 'done' },
  archived: { label: '已入库', variant: 'default' },
}

/** 案例卡字段的中文名，用于补全区显示 */
export const FIELD_LABELS: Record<keyof CaseCard, string> = {
  ore_type: '矿种',
  process: '作业工序',
  equipment: '设备',
  conditions: '工况',
  diagnosis: '诊断',
  action: '处置',
  result: '结果',
  tags: '标签',
}
