/* 中间件使你能拦截请求和响应，并在每次渲染页面或端点时动态注入行为。 */
import type { MiddlewareHandler } from 'astro';


export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 放行的路径：登录页与常见静态资源
  const allow = (path: string) => {
    if (path === '/login') return true;
    if (path.startsWith('/assets')) return true;
    if (path.startsWith('/_image')) return true;
    if (path.startsWith('/favicon')) return true;
    if (path.startsWith('/public')) return true;
    // 常见静态资源后缀
    if (/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|json|woff2?|ttf|eot)$/i.test(path)) return true;
    return false;
  };

  if (allow(pathname)) {
    return next();
  }

  const token = context.cookies.get('token')?.value;
  const employeeToken = context.cookies.get('employee_token')?.value;

  if (!token && !employeeToken) {
    const redirectTo = pathname + url.search;
    return context.redirect('/login?redirect=' + encodeURIComponent(redirectTo));
  }

  return next();
};