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
    // 监听所有网卡（0.0.0.0），允许同一 WiFi 下的其他设备通过局域网 IP 访问。
    // 否则默认只绑 localhost，局域网设备连不上 192.168.x.x:5173。
    host: true,
    // 把浏览器实际访问的 Host/协议透传给后端（X-Forwarded-Host/Proto），
    // 否则 OAuth 元数据 / 401 头里的 issuer 会写成后端的 localhost:4000，跨设备失效。
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
      // MCP Server 端点（Accio Work 等 MCP Client 接入），dev 下转发到 :4000
      '/mcp': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: forwardOriginalHost,
      },
      // MCP OAuth 浏览器授权流程（元数据发现 / 授权 / 令牌），同样转发到 :4000
      '/.well-known': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: forwardOriginalHost,
      },
      '/oauth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: forwardOriginalHost,
      },
    },
  },
})

/** 在转发请求时注入原始 Host/协议，使后端能拿到用户真实访问源。 */
function forwardOriginalHost(proxy: any) {
  proxy.on('proxyReq', (proxyReq: any, req: any) => {
    if (req.headers.host) proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
    if (!req.headers['x-forwarded-proto']) {
      proxyReq.setHeader('X-Forwarded-Proto', req.connection.encrypted ? 'https' : 'http');
    }
  });
}
