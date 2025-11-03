/**
 * 列表状态管理器
 * 用于统一管理列表的加载状态、分页信息等
 */

export interface ListStateElements {
  loadingIndicator: HTMLElement | null;
  noMoreData: HTMLElement | null;
  totalCountEl: HTMLElement | null;
  loadedCountEl: HTMLElement | null;
  pagination: HTMLElement | null;
  wrapper: HTMLElement | null;
}

export interface ListStateConfig {
  containerId?: string;          // 列表容器 ID，默认 'taskListContainer'
  autoCreate?: boolean;          // 是否自动创建状态元素，默认 true
  loadingText?: string;          // 加载中文字，默认 '加载中...'
  completeText?: string;         // 完成文字，默认 '已加载全部任务'
  elementIds?: {                 // 自定义元素 ID
    loadingIndicator?: string;
    noMoreData?: string;
    totalCount?: string;
    loadedCount?: string;
    pagination?: string;
    wrapper?: string;
  };
}

export class ListStateManager {
  private elements: ListStateElements;
  private config: Required<ListStateConfig>;

  constructor(config?: ListStateConfig) {
    // 默认配置
    this.config = {
      containerId: config?.containerId || 'taskListContainer',
      autoCreate: config?.autoCreate !== false,
      loadingText: config?.loadingText || '加载中...',
      completeText: config?.completeText || '已加载全部任务',
      elementIds: {
        loadingIndicator: config?.elementIds?.loadingIndicator || 'loadingIndicator',
        noMoreData: config?.elementIds?.noMoreData || 'noMoreData',
        totalCount: config?.elementIds?.totalCount || 'totalCount',
        loadedCount: config?.elementIds?.loadedCount || 'loadedCount',
        pagination: config?.elementIds?.pagination || 'paginationStats',
        wrapper: config?.elementIds?.wrapper || 'taskListWrapper',
      },
    };

    if (this.config.autoCreate) {
      this.createElements();
    }

    this.elements = this.getElements();
  }

  /**
   * 自动创建状态元素并插入到 DOM
   */
  private createElements(): void {
    const container = document.getElementById(this.config.containerId);
    if (!container) {
      console.warn(`Container #${this.config.containerId} not found, status elements will not be created.`);
      return;
    }

    const ids = this.config.elementIds;

    // 创建包装器（如果不存在）
    let wrapper = document.getElementById(ids.wrapper!);
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = ids.wrapper!;

      // 将容器移到包装器内
      const parent = container.parentElement;
      if (parent) {
        parent.insertBefore(wrapper, container);
        wrapper.appendChild(container);
      }
    }

    // 创建加载中指示器
    if (!document.getElementById(ids.loadingIndicator!)) {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = ids.loadingIndicator!;
      loadingIndicator.className = 'status-indicator loading-status';
      loadingIndicator.style.display = 'none';
      loadingIndicator.innerHTML = `
        <div class="status-icon">⏳</div>
        <span class="status-text">${this.config.loadingText}</span>
      `;
      wrapper.appendChild(loadingIndicator);
    }

    // 创建完成指示器
    if (!document.getElementById(ids.noMoreData!)) {
      const noMoreData = document.createElement('div');
      noMoreData.id = ids.noMoreData!;
      noMoreData.className = 'status-indicator complete-status';
      noMoreData.style.display = 'none';
      noMoreData.innerHTML = `
        <div class="status-icon">✅</div>
        <span class="status-text">${this.config.completeText}</span>
      `;
      wrapper.appendChild(noMoreData);
    }

    // 创建分页统计
    if (!document.getElementById(ids.pagination!)) {
      const pagination = document.createElement('div');
      pagination.id = ids.pagination!;
      pagination.className = 'pagination';
      pagination.innerHTML = `
        📊 共 <span id="${ids.totalCount}">0</span> 条记录 · 已加载 <span id="${ids.loadedCount}">0</span> 条
      `;
      wrapper.appendChild(pagination);
    }
  }

  /**
   * 获取所有元素引用
   */
  private getElements(): ListStateElements {
    const ids = this.config.elementIds;
    return {
      loadingIndicator: document.getElementById(ids.loadingIndicator!),
      noMoreData: document.getElementById(ids.noMoreData!),
      totalCountEl: document.getElementById(ids.totalCount!),
      loadedCountEl: document.getElementById(ids.loadedCount!),
      pagination: document.getElementById(ids.pagination!),
      wrapper: document.getElementById(ids.wrapper!),
    };
  }

  /**
   * 显示加载中状态
   */
  showLoading(): void {
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = 'flex';
    }
    if (this.elements.noMoreData) {
      this.elements.noMoreData.style.display = 'none';
    }
  }

  /**
   * 隐藏加载中状态
   */
  hideLoading(): void {
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = 'none';
    }
  }

  /**
   * 显示已加载全部状态
   */
  showComplete(): void {
    if (this.elements.noMoreData) {
      this.elements.noMoreData.style.display = 'flex';
    }
  }

  /**
   * 隐藏已加载全部状态
   */
  hideComplete(): void {
    if (this.elements.noMoreData) {
      this.elements.noMoreData.style.display = 'none';
    }
  }

  /**
   * 更新统计信息
   */
  updateStats(total: number, loaded: number): void {
    if (this.elements.totalCountEl) {
      this.elements.totalCountEl.textContent = String(total);
    }
    if (this.elements.loadedCountEl) {
      this.elements.loadedCountEl.textContent = String(loaded);
    }
  }

  /**
   * 检查并更新完成状态
   * @returns 是否已完成加载
   */
  checkAndUpdateComplete(loaded: number, total: number, limit: number): boolean {
    const isComplete = loaded >= total || loaded % limit !== 0 || loaded === 0;

    if (isComplete) {
      this.showComplete();
    } else {
      this.hideComplete();
    }

    return isComplete;
  }

  /**
   * 重置所有状态
   */
  reset(): void {
    this.hideLoading();
    this.hideComplete();
    this.updateStats(0, 0);
  }

  /**
   * 在请求开始时调用
   */
  onRequestStart(): void {
    this.showLoading();
  }

  /**
   * 在请求成功时调用
   */
  onRequestSuccess(total: number, loaded: number, limit: number): boolean {
    this.hideLoading();
    this.updateStats(total, loaded);
    return this.checkAndUpdateComplete(loaded, total, limit);
  }

  /**
   * 在请求失败时调用
   */
  onRequestError(): void {
    this.hideLoading();
    this.hideComplete();
  }
}

/**
 * 创建默认的列表状态管理器实例
 * @param config 配置选项
 * @returns ListStateManager 实例
 *
 * @example
 * // 自动创建所有状态元素
 * const stateManager = createListStateManager();
 *
 * @example
 * // 自定义配置
 * const stateManager = createListStateManager({
 *   containerId: 'myList',
 *   loadingText: 'Loading...',
 *   completeText: 'All data loaded'
 * });
 *
 * @example
 * // 不自动创建，使用已有的 HTML 元素
 * const stateManager = createListStateManager({
 *   autoCreate: false
 * });
 */
export function createListStateManager(config?: ListStateConfig): ListStateManager {
  return new ListStateManager(config);
}
