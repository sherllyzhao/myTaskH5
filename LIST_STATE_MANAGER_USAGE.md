# 列表状态管理器使用说明

## 概述

`listStateManager.ts` 提供了一个统一的列表状态管理工具，**自动创建和管理** UI 元素，处理以下功能：
- 🔄 加载中状态显示
- ✅ 已加载全部提示
- 📊 分页统计信息更新
- 🎯 自动状态切换
- ✨ **自动创建 HTML 元素（无需手动编写）**

## 快速开始

### 1. 最简单的用法（推荐）

#### HTML 结构
只需要一个列表容器即可，其他元素会自动创建：

```html
<div class="content">
  <!-- 只需要这一个容器，其他都会自动生成！ -->
  <div id="taskListContainer"></div>
</div>
```

#### JavaScript 代码
```typescript
import { createListStateManager } from "../utils/listStateManager";

// 创建管理器 - 会自动生成所有状态元素
const stateManager = createListStateManager();

// 就这么简单！现在可以直接使用了
async function loadData() {
  stateManager.onRequestStart();
  // ... 你的请求逻辑
}
```

### 2. 自定义配置

```typescript
import { createListStateManager } from "../utils/listStateManager";

const stateManager = createListStateManager({
  containerId: 'myListContainer',    // 自定义容器 ID
  loadingText: '正在加载数据...',    // 自定义加载文字
  completeText: '全部加载完成',      // 自定义完成文字
});
```

### 3. 使用已有 HTML（不自动创建）

如果你已经在 HTML 中写好了状态元素：

```typescript
const stateManager = createListStateManager({
  autoCreate: false  // 不自动创建，使用已有元素
});
```

## 自动创建的 HTML 结构

管理器会自动创建以下完整结构：

```html
<div class="content">
  <div id="taskListWrapper">           <!-- 自动创建的包装器 -->
    <div id="taskListContainer">       <!-- 你的列表容器 -->
      <!-- 任务列表 -->
    </div>

    <!-- 以下元素全部自动创建 -->
    <div id="loadingIndicator" class="status-indicator loading-status" style="display: none;">
      <div class="status-icon">⏳</div>
      <span class="status-text">加载中...</span>
    </div>

    <div id="noMoreData" class="status-indicator complete-status" style="display: none;">
      <div class="status-icon">✅</div>
      <span class="status-text">已加载全部任务</span>
    </div>

    <div id="paginationStats" class="pagination">
      📊 共 <span id="totalCount">0</span> 条记录 · 已加载 <span id="loadedCount">0</span> 条
    </div>
  </div>
</div>
```

## API 文档

### 配置选项 (ListStateConfig)

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `containerId` | string | `'taskListContainer'` | 列表容器的 ID |
| `autoCreate` | boolean | `true` | 是否自动创建状态元素 |
| `loadingText` | string | `'加载中...'` | 加载中提示文字 |
| `completeText` | string | `'已加载全部任务'` | 完成提示文字 |
| `elementIds` | object | 见下方 | 自定义元素 ID |

#### elementIds 默认值

```typescript
{
  loadingIndicator: 'loadingIndicator',
  noMoreData: 'noMoreData',
  totalCount: 'totalCount',
  loadedCount: 'loadedCount',
  pagination: 'paginationStats',
  wrapper: 'taskListWrapper'
}
```

### 核心方法

#### `onRequestStart()`
请求开始时调用，会自动：
- 显示"加载中"提示
- 隐藏"已加载全部"提示

#### `onRequestSuccess(total, loaded, limit)`
请求成功时调用，会自动：
- 隐藏"加载中"提示
- 更新分页统计（总数和已加载数）
- 检查是否已全部加载，显示/隐藏完成提示
- 返回是否已完成加载的布尔值

参数：
- `total`: 总记录数
- `loaded`: 当前已加载数量
- `limit`: 每页限制数量

返回：`boolean` - 是否已全部加载完成

#### `onRequestError()`
请求失败时调用，会自动：
- 隐藏"加载中"提示
- 隐藏"已加载全部"提示

### 其他方法

#### `showLoading()` / `hideLoading()`
手动控制加载状态显示/隐藏

#### `showComplete()` / `hideComplete()`
手动控制完成状态显示/隐藏

#### `updateStats(total, loaded)`
手动更新统计信息

#### `reset()`
重置所有状态到初始状态

## 完整示例

```typescript
import { createListStateManager } from "../utils/listStateManager";
import { createTaskCardHTML } from "../utils/taskCardTemplate";

let currentPage = 0;
let isLoading = false;
let hasMore = true;
const limit = 10;

// 初始化状态管理器
const stateManager = createListStateManager();

// 初始加载
async function loadInitialData(filters = {}) {
  if (isLoading) return;

  isLoading = true;
  hasMore = true;
  stateManager.onRequestStart();

  try {
    currentPage = 1;

    const response = await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ page: currentPage, limit, ...filters })
    });

    const result = await response.json();

    if (result.code === 1) {
      const tasks = result.data?.data || [];
      const total = result.data?.total || 0;

      // 清空并渲染
      taskListContainer.innerHTML = '';
      tasks.forEach(task => {
        taskListContainer.insertAdjacentHTML('beforeend', createTaskCardHTML(task));
      });

      // 自动更新状态
      const isComplete = stateManager.onRequestSuccess(total, tasks.length, limit);
      hasMore = !isComplete;
    }
  } catch (error) {
    stateManager.onRequestError();
  } finally {
    isLoading = false;
  }
}

// 加载更多
async function loadMore() {
  if (isLoading || !hasMore) return;

  isLoading = true;
  stateManager.onRequestStart();

  try {
    currentPage += 1;

    const response = await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ page: currentPage, limit })
    });

    const result = await response.json();

    if (result.code === 1) {
      const newTasks = result.data?.data || [];
      const total = result.data?.total || 0;

      // 追加新数据
      newTasks.forEach(task => {
        taskListContainer.insertAdjacentHTML('beforeend', createTaskCardHTML(task));
      });

      // 计算总加载数
      const currentLoaded = taskListContainer.children.length;

      // 自动更新状态
      const isComplete = stateManager.onRequestSuccess(total, currentLoaded, limit);
      hasMore = !isComplete;
    }
  } catch (error) {
    stateManager.onRequestError();
  } finally {
    isLoading = false;
  }
}
```

## 优势

✅ **自动化** - 无需手动控制每个状态元素
✅ **统一管理** - 所有列表页面使用相同的状态逻辑
✅ **类型安全** - TypeScript 支持
✅ **灵活配置** - 支持自定义元素 ID
✅ **易于维护** - 集中管理，修改方便

## 注意事项

1. 确保 HTML 中包含对应 ID 的元素
2. 在请求的正确时机调用对应方法
3. `onRequestSuccess` 的返回值表示是否已完成，可用于判断 `hasMore`
4. 建议在 `finally` 块中重置 `isLoading` 状态
