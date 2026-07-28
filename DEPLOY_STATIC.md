# GitHub Pages 静态部署指南

本项目已按 GitHub Pages 项目站点进行配置，仓库名为 `myTaskH5`。

## 一、部署地址

GitHub Pages 项目站点的地址格式为：

```text
https://<GitHub用户名>.github.io/myTaskH5/
```

Astro 配置中的：

```js
base: '/myTaskH5'
```

已经与仓库名保持一致。GitHub Actions 构建时会从 `GITHUB_REPOSITORY_OWNER` 自动生成站点 owner；因此不需要把具体 GitHub 用户名写死在代码里。

## 二、首次启用 GitHub Pages

1. 将本项目推送到 GitHub 仓库 `myTaskH5`。
2. 打开 GitHub 仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 的 **Source** 中选择 **GitHub Actions**。
4. 推送到 `master` 或 `main` 分支，或者在 **Actions** 页面手动执行 `Deploy Astro site to GitHub Pages`。
5. 等待 `build` 和 `deploy` 两个 Job 都成功后，再访问上面的站点地址。

项目已经包含：

```text
.github/workflows/deploy.yml
```

它会自动完成：

```text
安装依赖 → Astro 静态构建 → 上传 dist → 发布 GitHub Pages
```

## 三、本地检查

```bash
npm install
npx astro check
npm run dev
```

本地开发仍然使用 Vite proxy：

```text
/api      → https://api.china9.cn/api
/taskApi  → https://flexible.china9.cn/api
```

生产环境由客户端直接请求后端 API，不依赖 GitHub Pages 提供服务器端 API。

## 四、静态托管限制

### 1. GitHub Pages 不运行 SSR

GitHub Pages 只托管构建后的静态文件，不会运行：

- Astro SSR middleware；
- `src/pages/*.ts` 的运行时 API endpoint；
- Node.js server；
- 服务端反向代理。

项目已增加客户端兼容层：

```text
public/js/site-path.js
```

它会将旧代码中的 `/proxy`、`/api`、`/taskApi` 请求转换为：

- 本地开发：继续走 Vite proxy；
- GitHub Pages：改为直接请求后端 API。

因此，GitHub Pages 上不能把 `/proxy` 当作真正的后端代理使用。

### 2. 后端必须允许 CORS

GitHub Pages 页面访问后端时，浏览器会执行跨域检查。后端至少需要允许 GitHub Pages 域名访问相关接口，并正确处理：

- `OPTIONS` 预检请求；
- `Content-Type` 请求头；
- `Tokens` / `employee_token` 等认证字段；
- 文件上传接口；
- 错误响应和 401 响应。

如果后端不支持 CORS，页面即使部署成功，也可能出现登录失败、列表为空或文件上传失败。

### 3. Token 存储

当前前端会使用 Cookie、`localStorage` 和 `sessionStorage` 中的认证信息。GitHub Pages 是 HTTPS 站点，后端接口需要确认 Token 的传递方式与跨域策略匹配。

建议重点检查：

- 登录接口返回的 Token 是否能被前端保存；
- 后续请求是否携带 `tokens`；
- 401 响应是否能够跳转到 `/myTaskH5/login`；
- 后端是否依赖只在同域请求中才会发送的 Cookie。

### 4. 页面路径

项目站点必须使用带仓库名的路径：

```text
/myTaskH5/
/myTaskH5/login/
/myTaskH5/my-tasks/
/myTaskH5/task/
```

页面内的本地资源和导航已经使用 `import.meta.env.BASE_URL` 或 `sitePath()` 处理，不能再随意写成从域名根目录开始的 `/login`、`/common.css` 等路径。

任务详情目前通过查询参数加载，例如：

```text
/myTaskH5/task/?id=123
```

## 五、故障排查

### 页面打开后空白

1. 打开浏览器开发者工具的 Console；
2. 查看 Network 中的 API 请求；
3. 确认请求是否被 CORS 拦截；
4. 确认 API 返回的数据结构和登录 Token 是否正常。

### 刷新页面 404

优先访问构建后实际生成的目录 URL，例如：

```text
/myTaskH5/login/
/myTaskH5/my-tasks/
```

不要把项目站点误当成根站点访问。如果需要自定义域名，应重新评估 `base` 配置。

### GitHub Actions 构建失败

重点查看：

1. Actions 日志中的 `npm ci` 错误；
2. `npx astro check` 报出的 TypeScript/Astro 错误；
3. 是否在仓库 Settings → Pages 中选择了 GitHub Actions；
4. workflow 是否运行在 `master` 或 `main` 分支。
