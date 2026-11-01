import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 同源反代到自研 NestJS 后端（端口 4000）：浏览器以 /api 调用，Vite 去掉前缀转发。
      // 这样 SPA 与后端同域，无需 CORS；session cookie 由后端直接下发到 5173 域。
      // 注意：不要写 cookieDomainRewrite —— http-proxy 会把 Set-Cookie 的 Domain
      // 改写成空串（非法），浏览器直接丢弃 cookie，导致登录后立即被弹回登录页。
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 上传的产品图片由后端静态托管在 /uploads，dev 下同样转发到 :4000
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
