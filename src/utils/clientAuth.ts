/**
 * 客户端认证守卫
 * 用于静态部署模式下的客户端路由保护
 */

/**
 * 从 cookie 中获取指定名称的值
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }

  return null;
}

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  const token = getCookie('token');
  const employeeToken = getCookie('employee_token');

  return !!(token || employeeToken);
}

/**
 * 客户端路由守卫
 * 如果未登录，重定向到登录页
 */
export function requireAuth(): void {
  if (typeof window === 'undefined') return;

  if (!isAuthenticated()) {
    const currentPath = window.location.pathname + window.location.search;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }
}

/**
 * 获取当前用户的 token
 */
export function getAuthToken(): string | null {
  return getCookie('token') || getCookie('employee_token');
}
