// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // 使用 Vite 配置来设置代理
  vite: {
    server: {
      // 代理配置
      proxy: {
        // 将 /api 开头的请求代理到目标服务器
        '/api': {
          // 目标服务器地址
          target: 'https://api.china9.cn/api',
          // 修改请求头中的 host 值，以匹配目标URL的主机名
          changeOrigin: true,
          // 重写路径，去掉 /api 前缀
          rewrite: (path) => path.replace(/^\/api/, ''),
          // 配置安全选项，如果目标服务器使用自签名证书
          secure: true,
          // 配置 WebSocket 代理
          ws: true,
        },
        // 可以添加多个代理配置
        // '/other-api': {
        //   target: 'https://other-api.example.com',
        //   changeOrigin: true,
        // },
      },
    },
  },
});