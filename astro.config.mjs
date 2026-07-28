// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages 项目站点的仓库路径；本地和 Actions 构建都保持一致。
const repositoryName = 'myTaskH5';
const repositoryOwner = process.env.GITHUB_REPOSITORY_OWNER || process.env.GITHUB_REPOSITORY?.split('/')[0];
const site = repositoryOwner ? `https://${repositoryOwner}.github.io` : undefined;

export default defineConfig({
  output: 'static',
  site,
  base: `/${repositoryName}`,
  // 开发环境仍保留代理配置，方便本地调试；生产环境由客户端直连后端 API。
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
