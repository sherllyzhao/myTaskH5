(function () {
  const currentScript = document.currentScript;
  const scriptPath = currentScript && currentScript.src
    ? new URL(currentScript.src, window.location.href).pathname
    : '';
  const marker = '/js/site-path.js';
  const basePath = scriptPath.endsWith(marker)
    ? scriptPath.slice(0, -marker.length)
    : '/';
  const isLocalHost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.');

  window.__SITE_BASE_PATH__ = basePath || '/';
  window.__LOGIN_API_BASE__ = isLocalHost ? '/api' : 'https://api.china9.cn/api';
  window.__USER_API_BASE__ = isLocalHost ? '/userApi' : 'https://china9.cn/api';
  window.__TASK_API_BASE__ = isLocalHost ? '/taskApi' : 'https://flexible.china9.cn/api';
  // 兼容旧代码：/api 前缀默认视为业务 API，登录路径单独走 __LOGIN_API_BASE__。
  window.__API_BASE__ = window.__TASK_API_BASE__;

  window.sitePath = function (path) {
    const normalizedPath = String(path || '').replace(/^\/+/, '');
    const normalizedBasePath = window.__SITE_BASE_PATH__.replace(/\/+$/, '');
    return normalizedPath
      ? `${normalizedBasePath}/${normalizedPath}`
      : `${normalizedBasePath}/`;
  };

  // GitHub Pages 没有 Astro SSR endpoint。兼容旧代码中的 /proxy 和 /taskApi 请求，
  // 本地继续走 Vite proxy，生产环境改为直连后端 API。
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const requestUrl = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input && input.url;
    const pathname = requestUrl ? new URL(requestUrl, window.location.origin).pathname : '';
    const options = { ...(init || {}) };

    if (pathname === '/proxy' || pathname.endsWith('/proxy')) {
      let requestBody = {};
      try {
        requestBody = options.body ? JSON.parse(options.body) : {};
      } catch {
        return nativeFetch(input, init);
      }

      const targetPath = requestBody.path || '/taskorder/orderindex';
      delete requestBody.path;
      options.body = JSON.stringify(requestBody);
      return nativeFetch(`${window.__TASK_API_BASE__}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`, options);
    }

    if (pathname === '/taskApi' || pathname.startsWith('/taskApi/')) {
      const targetPath = pathname.slice('/taskApi'.length) || '/';
      const targetUrl = `${window.__TASK_API_BASE__}${targetPath}${requestUrl.includes('?') ? requestUrl.slice(requestUrl.indexOf('?')) : ''}`;
      return nativeFetch(targetUrl, options);
    }

    if (pathname === '/userApi' || pathname.startsWith('/userApi/')) {
      const targetPath = pathname.slice('/userApi'.length) || '/';
      const targetUrl = `${window.__USER_API_BASE__}${targetPath}${requestUrl.includes('?') ? requestUrl.slice(requestUrl.indexOf('?')) : ''}`;
      return nativeFetch(targetUrl, options);
    }

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      const targetPath = pathname.slice('/api'.length) || '/';
      const isLoginRequest = targetPath === '/login/auth' || targetPath.startsWith('/login/');
      const isUserInfoRequest = targetPath === '/user/infoClient';
      const apiBase = isLoginRequest
        ? window.__LOGIN_API_BASE__
        : isUserInfoRequest
          ? window.__USER_API_BASE__
          : window.__TASK_API_BASE__;
      const targetUrl = `${apiBase}${targetPath}${requestUrl.includes('?') ? requestUrl.slice(requestUrl.indexOf('?')) : ''}`;
      return nativeFetch(targetUrl, options);
    }

    return nativeFetch(input, init);
  };
})();
