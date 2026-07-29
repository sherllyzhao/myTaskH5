import type { FilterGroup } from "./filter";

// 全局类型声明

declare global {
  interface Window {
    loadInitialData: (formData?: any) => Promise<void>;
    loadMore: () => Promise<void>;
    handleTaskAccept: (event: Event, taskId: string | number, taskCompanyId: string | number, taskCompanyName: string, task: any) => void;
    currentUserInfo: any;
    filterGroupsConfig?: FilterGroup[];
    pageFieldConfig?: Record<string, unknown>;
    __SITE_BASE_PATH__: string;
    __LOGIN_API_BASE__: string;
    __USER_API_BASE__: string;
    __API_BASE__: string;
    __TASK_API_BASE__: string;
    sitePath: (path?: string) => string;
  }
}

export {};
