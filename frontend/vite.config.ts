import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 部署在 https://<user>.github.io/<repo>/ 这样的子路径下，
  // 资源必须用绝对子路径引用，否则会 404。本地开发留空即可。
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // 监听所有网卡，局域网内其它设备（手机）才能访问
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // 前端只请求 /api/*，由 Vite 转发给 Flask，避免跨域
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
