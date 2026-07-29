/**
 * API 配置
 * 静态部署模式下直接调用后端 API
 */

/**
 * 判断是否为开发环境
 */
export function isDev(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.startsWith('192.168.');
}

/**
 * 获取业务 API 基础 URL
 *
 * 登录接口单独使用 api.china9.cn，其他业务接口统一使用 flexible.china9.cn。
 */
export function getApiBase(): string {
  return isDev() ? '/taskApi' : 'https://flexible.china9.cn/api';
}

/**
 * 获取 China9 API 基础 URL（登录、用户信息等账号接口）
 */
export function getChina9ApiBase(): string {
  return isDev() ? '/api' : 'https://api.china9.cn/api';
}

/**
 * 获取 TaskAPI 基础 URL
 */
export function getTaskApiBase(): string {
  return getApiBase();
}

/**
 * 获取 API 完整 URL
 * @param path API 路径（不带前缀）
 * @param isTaskApi 是否是 taskApi
 */
export function getApiUrl(path: string, isTaskApi = false): string {
  const base = isTaskApi ? getTaskApiBase() : getChina9ApiBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * 获取存储的 token
 */
export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('token') || localStorage.getItem('employee_token');
}

/**
 * 获取认证 headers
 */
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 通用 API 请求函数
 */
export async function apiRequest<T = any>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    isTaskApi?: boolean;
  } = {}
): Promise<T> {
  const { method = 'POST', body, isTaskApi = false } = options;
  const url = getApiUrl(path, isTaskApi);

  const response = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
}

/**
 * TaskAPI 请求（简化调用）
 */
export async function taskApiRequest<T = any>(path: string, body?: any): Promise<T> {
  return apiRequest<T>(path, { body, isTaskApi: true });
}

/**
 * China9 API 请求（简化调用）
 */
export async function china9ApiRequest<T = any>(path: string, body?: any): Promise<T> {
  return apiRequest<T>(path, { body, isTaskApi: false });
}
