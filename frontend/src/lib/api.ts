import type { ForumApi } from './apiTypes'
import { localApi } from './localApi'
import { remoteApi } from './remoteApi'

/**
 * 演示模式：构建时用 VITE_DEMO=1 打开（GitHub Pages 用这套）。
 * 打开后不打后端，数据全在浏览器内存里，刷新即重置。
 */
export const DEMO = import.meta.env.VITE_DEMO === '1'

export const api: ForumApi = DEMO ? localApi : remoteApi

export type { Chunk, ForumApi, ListParams, ListResult, Meta, Stats } from './apiTypes'
