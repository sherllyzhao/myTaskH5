/**
 * 全局认证处理脚本
 * 处理401未授权状态码，自动跳转到登录页
 */

// 全局401状态码处理器
class AuthHandler {
    constructor() {
        this.init();
    }

    init() {
        // 拦截fetch请求
        this.interceptFetch();

        // 监听页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.checkFor401();
            });
        } else {
            this.checkFor401();
        }
    }

    // 获取token
    getToken() {
        return this.getCookie('employee_token') ||
            localStorage.getItem('employee_token') ||
            this.getCookie('token') ||
            localStorage.getItem('token');
    }

    // 拦截fetch请求
    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = async (url, options = {}) => {
            try {
                const token = self.getToken();

                // 如果有 token，自动添加到请求中
                if (token) {
                    // 处理请求体，添加 tokens
                    const method = (options.method || 'GET').toUpperCase();

                    if (method !== 'GET' && method !== 'HEAD') {
                        const contentType = options.headers?.['Content-Type'] ||
                            options.headers?.['content-type'] ||
                            (options.headers instanceof Headers ? options.headers.get('Content-Type') : null);

                        // JSON 请求体
                        if (contentType?.includes('application/json') && options.body) {
                            try {
                                const bodyData = JSON.parse(options.body);
                                if (!bodyData.tokens) {
                                    bodyData.tokens = token;
                                    options.body = JSON.stringify(bodyData);
                                }
                            } catch (e) {
                                // 解析失败，忽略
                            }
                        }
                        // FormData 请求体
                        else if (options.body instanceof FormData) {
                            if (!options.body.has('tokens')) {
                                options.body.append('tokens', token);
                            }
                        }
                        // URLSearchParams 请求体
                        else if (options.body instanceof URLSearchParams) {
                            if (!options.body.has('tokens')) {
                                options.body.append('tokens', token);
                            }
                        }
                        // 字符串形式的 form-urlencoded
                        else if (typeof options.body === 'string' &&
                            contentType?.includes('application/x-www-form-urlencoded')) {
                            if (!options.body.includes('tokens=')) {
                                options.body = `tokens=${encodeURIComponent(token)}&${options.body}`;
                            }
                        }
                        // 没有请求体的 POST 等请求
                        else if (!options.body) {
                            if (contentType?.includes('application/json')) {
                                options.body = JSON.stringify({ tokens: token });
                            } else {
                                options.body = `tokens=${encodeURIComponent(token)}`;
                                // 设置 Content-Type
                                if (!options.headers) options.headers = {};
                                if (options.headers instanceof Headers) {
                                    if (!options.headers.has('Content-Type')) {
                                        options.headers.set('Content-Type', 'application/x-www-form-urlencoded');
                                    }
                                } else {
                                    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/x-www-form-urlencoded';
                                }
                            }
                        }
                    } else {
                        // GET/HEAD 请求，添加到 URL 参数
                        const urlObj = new URL(url, window.location.origin);
                        if (!urlObj.searchParams.has('tokens')) {
                            urlObj.searchParams.set('tokens', token);
                            url = urlObj.toString();
                        }
                    }
                }

                const response = await originalFetch.call(window, url, options);

                // 检查HTTP状态码401
                if (response.status === 401) {
                    this.handleUnauthorized();
                    return response;
                }

                // 检查响应体中的业务状态码401或登录过期提示
                if (response.headers.get('content-type')?.includes('application/json')) {
                    const clone = response.clone();
                    try {
                        const data = await clone.json();
                        if (data && (data.code === 401 || self.isLoginExpiredMessage(data))) {
                            this.handleUnauthorized();
                        }
                    } catch (e) {
                        // 忽略JSON解析错误
                    }
                }

                return response;
            } catch (error) {
                console.error('Fetch拦截器错误:', error);
                throw error;
            }
        };
    }

    // 检查页面中是否存在401错误信息
    checkFor401() {
        // 检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error') === '401') {
            this.handleUnauthorized();
            return;
        }

        // 检查页面中的401错误信息
        const errorElements = document.querySelectorAll('[class*="error"], [class*="401"]');
        for (const element of errorElements) {
            const text = element.textContent || '';
            if (text.includes('401') || text.includes('未授权') || text.includes('登录过期')) {
                this.handleUnauthorized();
                break;
            }
        }

        // 检查特定的错误容器
        const errorContainer = document.querySelector('[data-error="401"]');
        if (errorContainer) {
            this.handleUnauthorized();
        }
    }

    // 判断响应体是否为登录过期提示（后端可能返回 HTTP 200 + 非 401 业务码）
    isLoginExpiredMessage(data) {
        const msg = (data && (data.msg || data.message)) || '';
        if (typeof msg !== 'string') return false;
        return msg.includes('登录过期') || msg.includes('请重新登录') || msg.includes('登录已过期');
    }

    // 处理未授权状态
    handleUnauthorized() {
        // 防止重复触发；登录页本身不做跳转，避免循环
        if (this.unauthorizedHandled) return;
        const loginPath = window.sitePath ? new URL(window.sitePath('/login'), window.location.origin).pathname : '/login';
        if (window.location.pathname === loginPath || window.location.pathname.indexOf(loginPath + '/') === 0) return;
        this.unauthorizedHandled = true;

        console.log('🔐 检测到未授权状态，准备跳转到登录页');

        // 清除本地存储的token
        this.clearTokens();

        // 显示提示信息
        this.showUnauthorizedMessage();

        // 延迟跳转到登录页
        setTimeout(() => {
            window.location.href = (window.sitePath ? window.sitePath('/login') : '/login') + '?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        }, 1500);
    }

    // 清除token
    clearTokens() {
        // 清除cookie
        document.cookie = 'employee_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // 清除localStorage
        localStorage.removeItem('employee_token');
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');

        // 清除sessionStorage
        sessionStorage.removeItem('employee_token');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('auth_token');
    }

    // 显示未授权提示信息
    showUnauthorizedMessage() {
        // 检查是否已经显示了提示
        if (document.getElementById('global-unauthorized-message')) {
            return;
        }

        const message = document.createElement('div');
        message.id = 'global-unauthorized-message';
        message.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                padding: 16px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideDown 0.3s ease-out;
            ">
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>🔐</span>
                    <span>登录已过期，正在跳转到登录页...</span>
                </div>
            </div>
            <style>
                @keyframes slideDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
            </style>
        `;

        document.body.appendChild(message);

        // 3秒后自动移除提示
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    // 检查当前是否已认证
    isAuthenticated() {
        const employeeToken = this.getCookie('employee_token') || localStorage.getItem('employee_token');
        const token = this.getCookie('token') || localStorage.getItem('token');
        return !!(employeeToken || token);
    }

    // 获取cookie值
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
}

// 初始化全局认证处理器
if (typeof window !== 'undefined') {
    window.authHandler = new AuthHandler();
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthHandler;
}
