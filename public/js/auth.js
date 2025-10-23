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

    // 拦截fetch请求
    interceptFetch() {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch.apply(window, args);

                // 检查HTTP状态码401
                if (response.status === 401) {
                    this.handleUnauthorized();
                    return response;
                }

                // 检查响应体中的业务状态码401
                if (response.headers.get('content-type')?.includes('application/json')) {
                    const clone = response.clone();
                    try {
                        const data = await clone.json();
                        if (data && data.code === 401) {
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

    // 处理未授权状态
    handleUnauthorized() {
        console.log('🔐 检测到未授权状态，准备跳转到登录页');

        // 清除本地存储的token
        this.clearTokens();

        // 显示提示信息
        this.showUnauthorizedMessage();

        // 延迟跳转到登录页
        setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
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
