// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  // 开发环境仍保留代理配置，方便本地调试
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'https://api.china9.cn/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: true,
          ws: true,
        },
        '/taskApi': {
          target: 'https://flexible.china9.cn/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/taskApi/, ''),
          secure: true,
          ws: true,
        },
      },
    },
  },
});