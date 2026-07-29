/**
 * 公共工具函数库
 * 用于客户端 script 标签中使用
 */

(function (global) {
  "use strict";

  /**
   * ============================================
   * 类型判断函数
   * ============================================
   */

  /**
   * 是否是项目
   * @param {number} orderType - 订单类型
   * @returns {boolean}
   */
  function isProject(orderType) {
    return orderType === 2 || orderType === 4;
  }

  /**
   * 获取类型名称
   * @param {number} orderType - 订单类型
   * @returns {string}
   */
  function getTypeName(orderType) {
    return isProject(orderType) ? "项目" : "任务";
  }

  /**
   * 是否是待接单
   * @param {Object} task - 任务对象
   * @returns {boolean}
   */
  function isWaiting(task) {
    return task && (task.status === 0 || task.statusInfo === "待接单");
  }

  /**
   * 是否是旧版本
   * @param {number} orderType - 订单类型
   * @returns {boolean}
   */
  function isOldVersion(orderType) {
    return orderType === 1 || orderType === 2;
  }

  /**
   * ============================================
   * 佣金计算函数
   * ============================================
   */

  /**
   * 格式化金额
   * @param {number|string} value - 金额
   * @returns {string}
   */
  function formatMoney(value) {
    const num = Number(value);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * 获取总佣金
   * 支持列表页和详情页两种数据格式
   * @param {Object} task - 任务对象
   * @returns {string}
   */
  function getTotalMoney(task) {
    if (!task) return "0.00";

    // 详情页格式：直接返回 money/hall_money 字段
    if (task.money !== undefined || task.hall_money !== undefined) {
      if (isProject(task.orderType)) {
        return task.hall_money || task.money || "0.00";
      }
      return task.money || "0.00";
    }

    // 列表页格式：计算 bountymoney + hall_money
    if (isProject(task.orderType)) {
      return formatMoney(
        Number(task.bountymoney || 0) + Number(task.hall_money || 0)
      );
    }
    if (Number(task.hall_user_money)) {
      return formatMoney(task.hall_user_money);
    }
    return formatMoney(
      Number(task.bountymoney || 0) + Number(task.hall_money || 0)
    );
  }

  /**
   * 获取基础佣金
   * 支持列表页和详情页两种数据格式
   * @param {Object} task - 任务对象
   * @returns {string}
   */
  function getBaseCommission(task) {
    if (!task) return "0.00";

    // 详情页格式：直接返回 basemoney/hall_basemoney 字段
    if (task.basemoney !== undefined || task.hall_basemoney !== undefined) {
      if (isProject(task.orderType)) {
        return task.hall_basemoney || task.basemoney || "0.00";
      }
      return task.basemoney || "0.00";
    }

    // 列表页格式：计算佣金
    if (isProject(task.orderType)) {
      return formatMoney(task.bountymoney);
    }
    if (Number(task.hall_user_money)) {
      return formatMoney(
        Number(task.hall_user_money) - Number(task.hall_money || 0)
      );
    }
    return formatMoney(task.bountymoney);
  }

  /**
   * 获取加价佣金
   * 支持列表页和详情页两种数据格式
   * @param {Object} task - 任务对象
   * @returns {string}
   */
  function getAddCommission(task) {
    if (!task) return "0.00";

    // 详情页格式：直接返回 addmoney/hall_addmoney 字段
    if (task.addmoney !== undefined || task.hall_addmoney !== undefined) {
      if (isProject(task.orderType)) {
        return task.hall_addmoney || task.addmoney || "0.00";
      }
      return task.addmoney || "0.00";
    }

    // 列表页格式
    return formatMoney(task.hall_money);
  }

  /**
   * 工期预警颜色
   * @param {number|string} status - 状态
   * @returns {string}
   */
  function earlyWarningOfConstructionPeriod(status) {
    if (!status) return "";
    const warnMap = {
      1: "blue",
      2: "green",
      3: "red",
      red: "red",
      orange: "orange",
      green: "green",
    };
    return warnMap[status] || "";
  }

  /**
   * ============================================
   * 认证相关函数
   * ============================================
   */

  /**
   * 从 cookie 中获取值
   * @param {string} name - cookie 名称
   * @returns {string|null}
   */
  function getCookie(name) {
    if (typeof document === "undefined") return null;
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) {
      return parts.pop().split(";").shift() || null;
    }
    return null;
  }

  /**
   * 获取 token（优先从 cookie，其次 localStorage）
   * @returns {string|null}
   */
  function getToken() {
    // 优先从 cookie 获取
    let token = getCookie("employee_token") || getCookie("token");
    if (token) return token;

    // 其次从 localStorage 获取
    if (typeof localStorage !== "undefined") {
      return (
        localStorage.getItem("employee_token") ||
        localStorage.getItem("token") ||
        null
      );
    }
    return null;
  }

  /**
   * 检查是否已登录
   * @returns {boolean}
   */
  function isAuthenticated() {
    return !!getToken();
  }

  /**
   * 重定向到登录页
   * @param {string} [currentPath] - 当前路径，默认自动获取
   */
  function redirectToLogin(currentPath) {
    if (typeof window === "undefined") return;
    const path =
      currentPath ||
      window.location.pathname + (window.location.search || "");
    window.location.href = (window.sitePath ? window.sitePath("/login") : "/login") + "?redirect=" + encodeURIComponent(path);
  }

  /**
   * 检查认证状态，未登录则重定向
   * @returns {boolean} - 是否已登录
   */
  function requireAuth() {
    if (!isAuthenticated()) {
      redirectToLogin();
      return false;
    }
    return true;
  }

  /**
   * 处理 API 响应的认证错误
   * @param {Response|Object} response - fetch Response 或解析后的数据
   * @returns {boolean} - 是否需要重定向（已处理）
   */
  function handleAuthError(response) {
    // 处理 fetch Response
    if (response instanceof Response) {
      if (response.status === 401) {
        redirectToLogin();
        return true;
      }
      return false;
    }

    // 处理解析后的数据
    if (response && (response.code === 401 || response.code === -1)) {
      redirectToLogin();
      return true;
    }
    return false;
  }

  /**
   * ============================================
   * API 配置函数
   * ============================================
   */

  /**
   * 判断是否为开发环境
   * @returns {boolean}
   */
  function isDev() {
    if (typeof window === "undefined") return false;
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.")
    );
  }

  /**
   * 获取业务 API 基础 URL
   * 登录接口单独使用 api.china9.cn，其他业务接口统一使用 flexible.china9.cn。
   * @returns {string}
   */
  function getApiBase() {
    return isDev() ? "/taskApi" : "https://flexible.china9.cn/api";
  }

  /**
   * 获取 TaskAPI 基础 URL
   * @returns {string}
   */
  function getTaskApiBase() {
    return getApiBase();
  }

  /**
   * ============================================
   * DOM 工具函数
   * ============================================
   */

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function}
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 时间限制（毫秒）
   * @returns {Function}
   */
  function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * 检查是否滚动到底部
   * @param {HTMLElement|string} element - 滚动容器元素或选择器
   * @param {number} [threshold=200] - 距离底部的阈值
   * @returns {boolean}
   */
  function isScrolledToBottom(element, threshold = 200) {
    const el =
      typeof element === "string" ? document.querySelector(element) : element;
    if (!el) return false;

    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;

    return scrollTop + clientHeight >= scrollHeight - threshold;
  }

  /**
   * 设置滚动加载监听
   * @param {HTMLElement|string} element - 滚动容器元素或选择器
   * @param {Function} loadMore - 加载更多的回调函数
   * @param {Object} [options] - 选项
   * @param {number} [options.threshold=200] - 距离底部的阈值
   * @param {number} [options.debounceWait=100] - 防抖等待时间
   * @returns {Function} - 移除监听的函数
   */
  function setupScrollLoader(element, loadMore, options = {}) {
    const { threshold = 200, debounceWait = 100 } = options;

    const el =
      typeof element === "string" ? document.querySelector(element) : element;
    if (!el) {
      console.warn("setupScrollLoader: element not found");
      return () => {};
    }

    const handleScroll = debounce(() => {
      if (isScrolledToBottom(el, threshold)) {
        loadMore();
      }
    }, debounceWait);

    el.addEventListener("scroll", handleScroll);

    // 返回移除监听的函数
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }

  /**
   * ============================================
   * 消息提示函数
   * ============================================
   */

  /**
   * 显示消息（优先使用 AlertBar 组件，否则使用 alert）
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型：'success' | 'error' | 'warning' | 'info'
   * @param {HTMLElement|string} [barElement] - AlertBar 元素或其 ID
   */
  function showMessage(message, type = "info", barElement) {
    let bar = barElement;

    // 如果传入的是 ID 字符串
    if (typeof barElement === "string") {
      bar = document.getElementById(barElement);
    }

    // 尝试查找默认的 AlertBar
    if (!bar) {
      const defaultBars = {
        success: document.getElementById("successBar"),
        error: document.getElementById("errorBar"),
        warning: document.getElementById("warningBar"),
        info: document.getElementById("infoBar"),
      };
      bar = defaultBars[type];
    }

    // 使用 AlertBar 组件
    if (bar && typeof bar.show === "function") {
      bar.textContent = message;
      bar.show();
      return;
    }

    // 回退到 alert
    alert(message);
  }

  /**
   * 显示成功消息
   * @param {string} message - 消息内容
   * @param {HTMLElement|string} [barElement] - AlertBar 元素或其 ID
   */
  function showSuccess(message, barElement) {
    showMessage(message, "success", barElement);
  }

  /**
   * 显示错误消息
   * @param {string} message - 消息内容
   * @param {HTMLElement|string} [barElement] - AlertBar 元素或其 ID
   */
  function showError(message, barElement) {
    showMessage(message, "error", barElement);
  }

  /**
   * ============================================
   * 时间工具函数
   * ============================================
   */

  /**
   * 移除时间部分，只保留日期
   * @param {string} time - 时间字符串
   * @returns {string}
   */
  function removeTime(time) {
    if (!time) return "";
    try {
      return time.split(" ")[0] || time;
    } catch {
      return time;
    }
  }

  /**
   * 时间戳转时间字符串
   * @param {number|string} timestamp - 时间戳
   * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - 格式
   * @returns {string}
   */
  function formatTimestamp(timestamp, format = "YYYY-MM-DD HH:mm:ss") {
    if (!timestamp) return "-";

    const ts =
      typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts)) return "-";

    // 如果是秒级时间戳，转换为毫秒
    const date = new Date(ts < 10000000000 ? ts * 1000 : ts);
    if (isNaN(date.getTime())) return "-";

    const pad = (n) => n.toString().padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return format
      .replace("YYYY", year.toString())
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  }

  /**
   * ============================================
   * URL 工具函数
   * ============================================
   */

  /**
   * 获取 URL 参数
   * @param {string} name - 参数名
   * @param {string} [url] - URL，默认当前页面 URL
   * @returns {string|null}
   */
  function getUrlParam(name, url) {
    const searchParams = new URLSearchParams(
      url ? new URL(url).search : window.location.search
    );
    return searchParams.get(name);
  }

  /**
   * 设置 URL 参数（不刷新页面）
   * @param {string} name - 参数名
   * @param {string} value - 参数值
   */
  function setUrlParam(name, value) {
    if (typeof window === "undefined" || !window.history) return;

    const url = new URL(window.location.href);
    if (value === null || value === undefined || value === "") {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }
    window.history.replaceState({}, "", url);
  }

  /**
   * ============================================
   * 数据处理函数
   * ============================================
   */

  /**
   * 规范化佣金快照数据
   * @param {any} payload - 原始数据
   * @param {number} [fallbackOrderType=0] - 默认订单类型
   * @returns {Object}
   */
  function normalizeCommissionSnapshot(payload, fallbackOrderType = 0) {
    if (!payload) {
      return { orderType: fallbackOrderType };
    }

    if (typeof payload === "string") {
      try {
        return normalizeCommissionSnapshot(
          JSON.parse(payload),
          fallbackOrderType
        );
      } catch {
        return { orderType: fallbackOrderType };
      }
    }

    if (typeof payload === "object") {
      return {
        ...payload,
        orderType: payload.orderType ?? fallbackOrderType,
      };
    }

    return { orderType: fallbackOrderType };
  }

  /**
   * 是否显示变更标签
   * @param {Object} data - 数据对象
   * @returns {boolean}
   */
  function showChangeTag(data) {
    if (data && data.orderType && +data.is_change) {
      if (+data.orderType === 2) {
        return true;
      }
    }
    return false;
  }

  /**
   * 区分抢单还是下发
   * @param {Object} task - 任务对象
   * @returns {boolean|string}
   */
  function getTaskPublishType(task) {
    if (+task.orderType === 3) {
      if (task.proid === 0) {
        return "单独下发";
      }
    }
    return false;
  }

  /**
   * 是否离职
   * @param {Object} task - 任务对象
   * @returns {boolean}
   */
  function isLeave(task) {
    if (task?.userlist?.[0]?.username) {
      return !task.appendlog && +task.permission !== 1;
    }
    return false;
  }

  // 导出到全局对象
  const Utils = {
    // 类型判断
    isProject,
    getTypeName,
    isWaiting,
    isOldVersion,

    // 佣金计算
    formatMoney,
    getTotalMoney,
    getBaseCommission,
    getAddCommission,
    earlyWarningOfConstructionPeriod,

    // 认证相关
    getCookie,
    getToken,
    isAuthenticated,
    redirectToLogin,
    requireAuth,
    handleAuthError,

    // API 配置
    isDev,
    getApiBase,
    getTaskApiBase,

    // DOM 工具
    debounce,
    throttle,
    isScrolledToBottom,
    setupScrollLoader,

    // 消息提示
    showMessage,
    showSuccess,
    showError,

    // 时间工具
    removeTime,
    formatTimestamp,

    // URL 工具
    getUrlParam,
    setUrlParam,

    // 数据处理
    normalizeCommissionSnapshot,
    showChangeTag,
    getTaskPublishType,
    isLeave,
  };

  // 挂载到全局
  global.Utils = Utils;

  // 同时导出常用函数到全局（方便直接调用）
  global.isProject = isProject;
  global.getTypeName = getTypeName;
  global.isWaiting = isWaiting;
  global.isOldVersion = isOldVersion;
  global.getTotalMoney = getTotalMoney;
  global.getBaseCommission = getBaseCommission;
  global.getAddCommission = getAddCommission;
  global.earlyWarningOfConstructionPeriod = earlyWarningOfConstructionPeriod;
  global.getCookie = getCookie;
  global.getToken = getToken;
  global.isAuthenticated = isAuthenticated;
  global.redirectToLogin = redirectToLogin;
  global.requireAuth = requireAuth;
  global.handleAuthError = handleAuthError;
  global.isDev = isDev;
  global.getApiBase = getApiBase;
  global.getTaskApiBase = getTaskApiBase;
  global.debounce = debounce;
  global.throttle = throttle;
  global.showMessage = showMessage;
  global.showSuccess = showSuccess;
  global.showError = showError;
  global.formatTimestamp = formatTimestamp;
  global.getUrlParam = getUrlParam;
  global.normalizeCommissionSnapshot = normalizeCommissionSnapshot;
})(typeof window !== "undefined" ? window : this);
