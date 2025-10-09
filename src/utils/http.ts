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

// 获取完整URL（处理相对路径）
const getFullUrl = (url: string): string => {
  if (url.startsWith('http')) {
    return url;
  }
  
  // 根据环境配置基础URL
  const baseUrl = import.meta.env.PUBLIC_API_BASE_URL || '/api';
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
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
  
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else if (contentType?.includes('text/')) {
    data = await response.text();
  } else {
    data = await response.blob();
  }
  
  // 处理HTTP状态码
  if (!response.ok) {
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
      return {
        ...data,
        success: data.code === 200 || data.code === 0, // 根据业务约定调整
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
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise(mergedConfig.timeout || DEFAULT_CONFIG.timeout),
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
    http.setGlobalHeader('Authorization', token ? `Bearer ${token}` : null);
  },
};

export default http;