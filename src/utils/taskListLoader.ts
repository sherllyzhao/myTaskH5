/**
 * 任务列表加载器
 * 提供通用的任务列表加载和滚动加载功能
 */

import { createTaskCardHTML } from "../utils/taskCardTemplate";
import { createListStateManager } from "../utils/listStateManager";

/**
 * 创建任务列表加载器
 * @param {Object} options - 配置选项
 * @param {string} options.apiPath - API 路径
 * @param {HTMLElement} options.container - 列表容器元素
 * @param {number} options.limit - 每页加载数量
 * @returns {Object} 加载器实例
 */
export function createTaskListLoader(options: { apiPath: any; container: any; limit?: 10 | undefined; hall_type?: any; order?: any; status?: any;}) {
	const { apiPath, container, limit = 10, hall_type, order, status } = options;

	// 状态变量
	let currentPage = 0;
	let isLoading = false;
	let hasMore = true;

	// 请求配置
	const requestConfig = {
		path: apiPath,
		enterpriseSide: "pc"
	};

	// 初始化状态管理器
	const stateManager = createListStateManager();

	/**
	 * 加载初始数据
	 * @param {Object} formData - 筛选表单数据
	 */
	async function loadInitialData(formData: object = {}) {
		if (isLoading) return;

		isLoading = true;
		hasMore = true;

		// 显示加载状态
		if (stateManager) {
			stateManager.onRequestStart();
		}

		try {
			currentPage = 1;

			// 发送请求
			const response = await fetch(`/proxy`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...requestConfig,
					page: currentPage,
					limit: limit,
					...formData
				}),
			});

			if (response.status === 401) {
				window.location.href = typeof (globalThis as any).sitePath === "function" ? (globalThis as any).sitePath("/login") : "/login";
				return;
			}

			const result = await response.json();

			if (result.code === 401) {
				window.location.href = typeof (globalThis as any).sitePath === "function" ? (globalThis as any).sitePath("/login") : "/login";
				return;
			}

			if (result.code === 1) {
				const tasks = result.data?.data || [];
				const total = result.data?.total || result.data?.count || 0;

				// 清空容器并添加新任务
				if (container) {
					container.innerHTML = "";

					if (tasks.length > 0) {
						tasks.forEach((task: { description: any[]; }) => {
							// 处理描述字段
							if (Object.prototype.toString.call(task.description) === '[object Array]') {
								task.description = task.description.map((d) => d.condition_title + '：' + d.condition);
								if (task.description.length > 0) {
									// @ts-ignore
									task.description = task.description.join('\n');
								}
							}

							const taskHTML = createTaskCardHTML(task);
							container.insertAdjacentHTML("beforeend", taskHTML);
						});
					} else {
						// 没有数据时显示提示
						container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">📭 暂无任务</div>';
					}
				}

				// 使用状态管理器更新状态
				const isComplete = stateManager.onRequestSuccess(total, tasks.length, limit);
				hasMore = !isComplete;

			} else {
				console.error("加载失败:", result.msg || "未知错误");
				if (container) {
					container.innerHTML = '<div style="text-align: center; padding: 40px; color: #f56565;">❌ 加载失败</div>';
				}
				stateManager.onRequestError();
			}
		} catch (error) {
			console.error("加载失败:", error);
			if (container) {
				container.innerHTML = '<div style="text-align: center; padding: 40px; color: #f56565;">❌ 网络错误</div>';
			}
			stateManager.onRequestError();
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 加载更多数据
	 */
	async function loadMore() {
		if (isLoading || !hasMore) {
			return;
		}

		isLoading = true;
		stateManager.onRequestStart();

		try {
			currentPage += 1;

			const response = await fetch(`/proxy`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...requestConfig,
					page: currentPage,
					limit: limit,
					hall_type: hall_type ?? '',
					order: order ?? 'desc',
					status: status ?? ''
				}),
			});

			if (response.status === 401) {
				window.location.href = typeof (globalThis as any).sitePath === "function" ? (globalThis as any).sitePath("/login") : "/login";
				return;
			}

			const result = await response.json();

			if (result.code === 401) {
				window.location.href = typeof (globalThis as any).sitePath === "function" ? (globalThis as any).sitePath("/login") : "/login";
				return;
			}

			if (result.code === 1) {
				const newTasks = result.data?.data || [];
				const total = result.data?.total || result.data?.count || 0;

				// 添加新任务到列表
				if (newTasks.length > 0) {
					newTasks.forEach((task: any) => {
						const taskHTML = createTaskCardHTML(task);
						container && container.insertAdjacentHTML("beforeend", taskHTML);
					});
				}

				// 计算当前已加载总数
				const currentLoaded = (container?.children.length || 0);

				// 使用状态管理器更新状态
				const isComplete = stateManager.onRequestSuccess(total, currentLoaded, limit);
				hasMore = !isComplete;

			} else {
				console.error("加载失败:", result.msg || "未知错误");
				stateManager.onRequestError();
				hasMore = false;
			}
		} catch (error) {
			console.error("加载失败:", error);
			stateManager.onRequestError();
			hasMore = false;
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 检测是否到达底部
	 */
	function checkScrollBottom() {
		// 获取 .wrap 滚动容器
		const wrapElement = document.querySelector('.wrap');
		if (!wrapElement) return;

		// 获取滚动位置
		const scrollTop = wrapElement.scrollTop;
		const scrollHeight = wrapElement.scrollHeight;
		const clientHeight = wrapElement.clientHeight;

		// 距离底部还有 200px 时就开始加载
		if (scrollTop + clientHeight >= scrollHeight - 200) {
			loadMore();
		}
	}

	/**
	 * 防抖函数
	 */
	function debounce(func: { (): void; (arg0: any): void; }, wait: number | undefined) {
		let timeout: string | number | NodeJS.Timeout | undefined;
		return function executedFunction(...args: any[]) {
			const later = () => {
				clearTimeout(timeout);
				// @ts-ignore
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	/**
	 * 初始化滚动监听
	 */
	function initScrollListener() {
		const debouncedScroll = debounce(checkScrollBottom, 200);
		const wrapElement = document.querySelector('.wrap');
		if (wrapElement) {
			wrapElement.addEventListener("scroll", debouncedScroll);
		}
	}

	// 返回公共接口
	return {
		loadInitialData,
		loadMore,
		initScrollListener
	};
}
