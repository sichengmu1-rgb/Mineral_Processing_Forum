import { Info } from 'lucide-react'
import { useState } from 'react'

import { DEMO } from '@/lib/api'

/**
 * 静态演示版提示条。
 *
 * 不说明的话，访问者会以为发帖之后数据没保存是 bug——
 * 其实是这个版本没有后端，数据只在浏览器内存里。
 */
export function DemoBanner() {
  const [hidden, setHidden] = useState(false)
  if (!DEMO || hidden) return null

  return (
    <div className="border-b border-primary/20 bg-primary/5">
      <div className="container flex items-start gap-2 py-2.5 text-xs">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="flex-1 text-muted-foreground">
          这是<strong className="font-medium text-foreground">静态演示版</strong>：
          没有后端，数据只存在你的浏览器里，刷新即重置。
          发帖、回答、补全案例卡都可以正常操作——
          把一条帖子补到「已闭环」，就能在「数据」页看到它变成一条知识片段。
        </p>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          知道了
        </button>
      </div>
    </div>
  )
}
