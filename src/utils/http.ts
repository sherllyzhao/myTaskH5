/**
 * HTTP 请求工具类
 * 封装 fetch API，统一处理请求头、响应状态码和错误处理
 */

// 请求配置接口
export interface RequestConfig extends Omit<RequestInit, 'headers'> {
  // 自定义超时时间（毫秒）
  timeout?: number;
  // 是否自动处理错误响应（4xx, 5xx）
  handleErrorResponse?: boolean;
  // 请求头（覆盖 RequestInit 的 HeadersInit，使用可索引的字典）
  headers?: Record<string, string>;
  // 自定义请求头（在本工具额外合并使用）
  customHeaders?: Record<string, string>;
  // 是否携带凭证（cookies）
  withCredentials?: boolean;
}

// 响应结果接口
export interface ApiResponse<T = any> {
  code: number;       // 业务状态码
  data: T;            // 响应数据
  message: string;    // 响应消息
  success: boolean;   // 请求是否成功
}

// 默认配置
const DEFAULT_CONFIG: RequestConfig = {
  timeout: 30000,
  handleErrorResponse: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
};

/**
 * 获取完整URL（处理相对路径，避免重复前缀并兼容 SSR）
 * - 已是绝对地址直接返回
 * - 若 url 已以 baseUrl 开头，直接返回（避免重复）
 * - 否则拼接 baseUrl 与路径
 * - SSR 下若为相对地址，且配置了 import.meta.env.SITE，则转为绝对 URL
 */
const getFullUrl = (url: string): string => {
  // 绝对地址
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // 基础 URL，去掉尾部斜杠
  const configured = import.meta.env.PUBLIC_API_BASE_URL || '/api';
  const base = String(configured).replace(/\/+$/, '');

  // 如果传入的 url 已经以 base 开头，避免重复
  if (url === base || url.startsWith(`${base}/`)) {
    // SSR 下将相对路径转换为绝对 URL（若 SITE 可用）
    if (typeof window === 'undefined' && url.startsWith('/')) {
      const site = import.meta.env.SITE;
      if (site) {
        return new URL(url, site).toString();
      }
    }
    return url;
  }

  // 规范路径前导斜杠并拼接
  const path = url.startsWith('/') ? url : `/${url}`;
  const combined = `${base}${path}`;

  // 若 base 为绝对地址，直接返回
  if (/^https?:\/\//i.test(base)) {
    return combined;
  }

  // SSR 下将相对路径转换为绝对 URL（若 SITE 可用）
  if (typeof window === 'undefined') {
    const site = import.meta.env.SITE;
    if (site) {
      return new URL(combined, site).toString();
    }
  }

  // 浏览器环境保持相对路径
  return combined;
};

// 处理请求超时
const timeoutPromise = (timeout: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`请求超时，超过 ${timeout}ms`));
    }, timeout);
  });
};

// 处理响应状态
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  // 获取响应数据
  const contentType = response.headers.get('content-type');
  let data: any;

  // 先获取原始文本，用于调试
  const rawText = await response.text();

  if (contentType?.includes('application/json')) {
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('❌ JSON 解析失败，原始响应:', rawText.substring(0, 500));
      throw {
        code: -1,
        data: null,
        message: `JSON 解析失败: ${rawText.substring(0, 200)}`,
        success: false,
      };
    }
  } else if (contentType?.includes('text/')) {
    data = rawText;
    // 如果返回的是 HTML 错误页面，打印出来
    if (rawText.includes('Fatal error') || rawText.includes('ErrorException')) {
      console.error('❌ 后端返回错误页面:', rawText.substring(0, 1000));
    }
  } else {
    // 尝试解析为 JSON，如果失败则当作文本
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  // 处理HTTP状态码
  if (!response.ok) {
    // 处理401未授权状态码
    if (response.status === 401) {
      // 清除本地存储的token
      if (typeof window !== 'undefined') {
        // 清除cookie中的token
        document.cookie = 'employee_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // 跳转到登录页
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }

    const error: ApiResponse = {
      code: response.status,
      data: null,
      message: data?.message || `请求失败: ${response.status} ${response.statusText}`,
      success: false,
    };
    throw error;
  }

  // 处理业务状态码（假设后端返回格式为 {code, data, message}）
  if (typeof data === 'object' && data !== null) {
    // 如果后端已经返回了标准格式
    if ('code' in data && 'data' in data && 'message' in data) {
      // 处理业务状态码401未授权
      if (data.code === 401) {
        // 清除本地存储的token
        if (typeof window !== 'undefined') {
          // 清除cookie中的token
          document.cookie = 'employee_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

          // 跳转到登录页
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }

      return {
        ...data,
        success: data.code === 200 || data.code === 1, // 根据业务约定调整
      };
    }

    // 后端返回的不是标准格式，进行包装
    return {
      code: 200,
      data,
      message: 'success',
      success: true,
    };
  }

  // 非对象数据直接返回
  return {
    code: 200,
    data,
    message: 'success',
    success: true,
  };
};

// 创建请求函数
const createRequest = (method: string) => {
  return async <T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<ApiResponse<T>> => {
    // 合并配置
    const mergedConfig: RequestConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      method,
      headers: {
        ...DEFAULT_CONFIG.headers,
        ...config.headers,
        ...config.customHeaders,
      },
    };

    // 处理请求体
    if (data) {
      if (method === 'GET' || method === 'DELETE') {
        // 将数据转换为查询参数
        const queryParams = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });

        const queryString = queryParams.toString();
        if (queryString) {
          url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
        }
      } else {
        // POST, PUT, PATCH 等方法
        if (mergedConfig.headers?.['Content-Type'] === 'application/json') {
          mergedConfig.body = JSON.stringify(data);
        } else if (mergedConfig.headers?.['Content-Type'] === 'application/x-www-form-urlencoded') {
          // 将对象转换为URLSearchParams格式
          const formData = new URLSearchParams();
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                // 数组按 PHP 格式：key[0]=value0&key[1]=value1
                value.forEach((item, index) => {
                  formData.append(`${key}[${index}]`, String(item));
                });
              } else {
                formData.append(key, String(value));
              }
            }
          });
          mergedConfig.body = formData.toString();
        } else if (data instanceof FormData) {
          mergedConfig.body = data;
          // 使用FormData时，让浏览器自动设置Content-Type
          delete mergedConfig.headers?.['Content-Type'];
        }
      }
    }

    // 处理凭证
    if (mergedConfig.withCredentials) {
      mergedConfig.credentials = 'include';
    }

    try {
      // 创建请求
      const fullUrl = getFullUrl(url);
      const fetchPromise = fetch(fullUrl, mergedConfig);

      // 处理超时
      const timeoutMs = mergedConfig.timeout ?? DEFAULT_CONFIG.timeout ?? 30000;
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise(timeoutMs),
      ]);

      // 处理响应
      return await handleResponse<T>(response);
    } catch (error) {
      // 处理网络错误或超时
      if (error instanceof Error) {
        throw {
          code: -1,
          data: null,
          message: error.message,
          success: false,
        };
      }
      // 抛出已处理的API错误
      throw error;
    }
  };
};

// 导出HTTP方法
export const http = {
  get: createRequest('GET'),
  post: createRequest('POST'),
  put: createRequest('PUT'),
  delete: createRequest('DELETE'),
  patch: createRequest('PATCH'),

  // 上传文件的便捷方法
  upload: async <T = any>(url: string, file: File | Blob, fieldName = 'file', extraData?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> => {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (extraData) {
      Object.entries(extraData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }

    return http.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        // 不设置Content-Type，让浏览器自动处理
      },
    });
  },

  // 设置全局请求头（如认证令牌）
  setGlobalHeader: (key: string, value: string | null) => {
    if (!DEFAULT_CONFIG.headers) {
      DEFAULT_CONFIG.headers = {};
    }
    if (value === null) {
      delete DEFAULT_CONFIG.headers[key];
    } else {
      DEFAULT_CONFIG.headers[key] = value;
    }
  },

  // 设置认证令牌的便捷方法
  setToken: (token: string | null) => {
    http.setGlobalHeader('Tokens', token || null);
  },
};

export default http;
