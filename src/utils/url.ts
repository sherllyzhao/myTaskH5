export function joinUrl(a: string, b: string): string {
  const left = String(a).replace(/\/+$/, '');
  const right = String(b).replace(/^\/+/, '');
  return `${left}/${right}`;
}

/**
 * 构造 API 的完整 URL
 * - 当 PUBLIC_API_BASE_URL 为绝对地址时，直接与 path 拼接返回
 * - 当为相对路径时，优先使用传入的 origin（如 Astro.url.origin）构造绝对地址
 * - 若缺少 origin，则返回相对路径，浏览器端可正常使用
 */
export function buildApiUrl(path: string, origin?: string): string {
  const apiBase = (import.meta as any).env?.PUBLIC_API_BASE_URL || '/api';
  const combined = joinUrl(apiBase, path);

  // 绝对地址，直接返回
  if (/^https?:\/\//i.test(apiBase)) {
    return combined;
  }

  // SSR/服务端优先使用外部传入的 origin，其次尝试使用 SITE
  const site = (import.meta as any).env?.SITE;
  const baseOrigin = origin || site;
  if (baseOrigin) {
    return joinUrl(String(baseOrigin).replace(/\/+$/, ''), combined);
  }

  // 无可用 origin，返回相对路径（浏览器环境可用）
  return combined;
}