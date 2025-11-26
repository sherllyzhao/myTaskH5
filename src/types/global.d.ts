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
  }
}

export {};
