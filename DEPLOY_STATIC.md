# 静态部署指南

本项目已改造为**纯静态模式**，可以部署到任何静态文件服务器。

## 📦 构建步骤

```bash
# 1. 安装依赖
npm install

# 2. 构建静态文件
npm run build
```

构建完成后，所有静态文件将生成到 `dist/` 目录。

## 🚀 部署方式

### 方式 1：直接上传到静态文件服务器

将 `dist/` 目录中的所有文件上传到服务器的 web 根目录：

```
dist/
├── index.html          # 首页
├── login/              # 登录页
├── my-tasks/           # 我的任务
├── task/               # 任务详情
├── _astro/             # JS/CSS 资源
├── js/                 # 公共 JS
├── common.css          # 公共样式
└── ...
```

### 方式 2：使用 Nginx

**nginx.conf 配置示例：**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # 处理客户端路由（SPA 模式）
    location / {
        try_files $uri $uri/ $uri.html /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 方式 3：使用 Apache

**.htaccess 配置：**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # 如果请求的是文件或目录，直接返回
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # 否则重定向到 index.html
    RewriteRule . /index.html [L]
</IfModule>

# 静态资源缓存
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

## ⚙️ 环境说明

### 开发环境 vs 生产环境

项目会自动检测运行环境：

- **开发环境**（localhost/127.0.0.1/192.168.*）：
  - API 请求通过 Vite 代理（`/api` 和 `/taskApi`）
  - 需要运行 `npm run dev`

- **生产环境**（其他域名）：
  - API 请求直接调用后端：
    - `https://api.china9.cn/api`
    - `https://flexible.china9.cn/api`

### 后端 CORS 要求

**重要**：后端 API 必须支持 CORS，允许前端域名访问。

如果后端不支持 CORS，需要在 Nginx 中配置反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;

    # 代理 /api 请求
    location /api/ {
        proxy_pass https://api.china9.cn/api/;
        proxy_set_header Host api.china9.cn;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 代理 /taskApi 请求
    location /taskApi/ {
        proxy_pass https://flexible.china9.cn/api/;
        proxy_set_header Host flexible.china9.cn;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 静态文件
    location / {
        try_files $uri $uri/ $uri.html /index.html;
    }
}
```

## 🔍 验证部署

部署完成后，访问以下页面验证：

1. **登录页**：`https://your-domain.com/login`
2. **首页**：`https://your-domain.com/`（需要先登录）
3. **我的任务**：`https://your-domain.com/my-tasks`

## ⚠️ 注意事项

### 1. 动态路由处理

动态路由（如 `/task/123`）在静态模式下的处理方式：

- 构建时生成一个通用页面（`/task/placeholder/`）
- 实际访问时，数据由客户端 JavaScript 从 URL 中获取 ID 并调用 API 加载

**重要**：确保服务器配置了 URL 重写，将所有路由请求指向对应的 HTML 文件。

### 2. 认证机制

- 使用 `localStorage` 和 `cookie` 存储 token
- 客户端 JavaScript 检查登录状态
- 未登录自动跳转到 `/login`

### 3. API 调用

所有 API 调用都在客户端进行：

```javascript
// 自动检测环境
const isDev = window.location.hostname === 'localhost';
const apiBase = isDev ? '/api' : 'https://api.china9.cn/api';

// 发送请求
fetch(`${apiBase}/taskorder/orderindex`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* ... */ })
});
```

### 4. 警告信息

构建时可能看到以下警告，可以忽略：

```
[WARN] `Astro.request.headers` was used when rendering...
```

这是因为某些页面在 SSR 时使用了 `Astro.request.headers`，但在静态模式下这些代码不会执行。

## 📝 改造说明

本项目从 SSR 模式改造为静态模式，主要变更：

1. ✅ 移除服务器端中间件（`middleware.ts`）
2. ✅ 所有数据获取改为客户端进行
3. ✅ API 调用直接访问后端（生产环境）
4. ✅ 动态路由使用 placeholder 预渲染
5. ✅ 认证逻辑改为客户端检查

## 🆘 故障排查

### 问题 1：页面空白

**原因**：API 请求失败或 CORS 错误

**解决**：
1. 打开浏览器开发者工具（F12）
2. 查看 Console 和 Network 标签
3. 检查 API 请求是否成功
4. 确认后端支持 CORS

### 问题 2：登录后跳转失败

**原因**：token 未正确存储

**解决**：
1. 检查 `localStorage` 中是否有 `token` 或 `employee_token`
2. 检查 cookie 是否正确设置
3. 清除浏览器缓存后重试

### 问题 3：动态路由 404

**原因**：服务器未配置 URL 重写

**解决**：
- Nginx：添加 `try_files $uri $uri/ $uri.html /index.html;`
- Apache：添加 `.htaccess` 重写规则

## 📞 技术支持

如有问题，请检查：
1. 浏览器控制台错误信息
2. 网络请求是否成功
3. 后端 API 是否正常
4. 服务器配置是否正确
