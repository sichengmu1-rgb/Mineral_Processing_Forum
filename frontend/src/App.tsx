import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { CasesPage } from '@/pages/CasesPage'
import { DetailPage } from '@/pages/DetailPage'
import { ListPage } from '@/pages/ListPage'
import { MePage } from '@/pages/MePage'
import { NewPage } from '@/pages/NewPage'
import { StatsPage } from '@/pages/StatsPage'

export default function App() {
  return (
    // GitHub Pages 部署在 /<repo>/ 子路径下，路由必须知道这一段前缀，
    // 否则 URL 是 /Mineral_Processing_Forum/ 时匹配不到 "/" 这条路由——
    // 表现就是整页白屏，但控制台只给一句 "No routes matched location"。
    // Vite 的 BASE_URL 在本地开发时是 "/"，构建时是配置的 base。
    // React Router 的 basename 不能带结尾斜杠。BASE_URL 在构建产物里是
    // "/Mineral_Processing_Forum/"，直接传进去会匹配不到，必须削掉末尾的 "/"。
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/+$/, '')}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ListPage />} />
          <Route path="new" element={<NewPage />} />
          <Route path="posts/:id" element={<DetailPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="me" element={<MePage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
