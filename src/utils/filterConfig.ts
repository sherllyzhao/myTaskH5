/**
 * 筛选配置工具 - 共享筛选器配置和数据处理
 */

// 筛选表单数据结构
export interface FilterFormData {
  name: string;
  orderType: string;
  sort: string;
  moneyInput: string[] | number[];
  ordertime: string[];
  enddatatime: string[];
  performtime: string[];
}

/**
 * 筛选器配置常量
 */
export const FILTER_CONFIG = {
  // 筛选器字段映射
  fieldMappings: {
    name: 'name',
    orderType: 'projectTask',
    sort: 'order',
    amountStart: 'amountStart',
    amountEnd: 'amountEnd',
    publishStart: 'publishStart',
    publishEnd: 'publishEnd',
    deadlineStart: 'deadlineStart',
    deadlineEnd: 'deadlineEnd',
    orderStart: 'orderStart',
    orderEnd: 'orderEnd'
  } as const,

  // 默认值配置
  defaults: {
    projectTask: '0',
    order: 'id'
  } as const
};

/**
 * 验证筛选数据
 */
export function validateFilterData(data: FilterFormData): boolean {
  // 验证金额范围
  if (data.moneyInput[0] && data.moneyInput[1]) {
    const start = parseFloat(data.moneyInput[0] as string);
    const end = parseFloat(data.moneyInput[1] as string);
    if (start > end) {
      console.warn('开始金额不能大于结束金额');
      return false;
    }
  }

  // 验证时间范围
  const validateTimeRange = (range: [string, string], fieldName: string) => {
    if (range[0] && range[1]) {
      const startTime = new Date(range[0]).getTime();
      const endTime = new Date(range[1]).getTime();
      if (startTime > endTime) {
        console.warn(`${fieldName}开始时间不能大于结束时间`);
        return false;
      }
    }
    return true;
  };

  return validateTimeRange(data.ordertime as [string, string], '发布时间') &&
         validateTimeRange(data.enddatatime as [string, string], '截止时间') &&
         validateTimeRange(data.performtime as [string, string], '接单时间');
}

/**
 * 序列化筛选数据为查询参数
 */
export function serializeFilters(data: FilterFormData): Record<string, string> {
  const params: Record<string, string> = {};

  // 处理单值字段
  if (data.name) params.name = data.name;
  if (data.orderType && data.orderType !== FILTER_CONFIG.defaults.projectTask) {
    params.orderType = data.orderType;
  }
  if (data.sort && data.sort !== FILTER_CONFIG.defaults.order) {
    params.sort = data.sort;
  }

  // 处理范围字段
  const serializeRange = (range: [string, string], paramName: string) => {
    if (range[0]) params[`${paramName}Start`] = range[0];
    if (range[1]) params[`${paramName}End`] = range[1];
  };

  serializeRange(data.moneyInput as [string, string], 'amount');
  serializeRange(data.ordertime as [string, string], 'publish');
  serializeRange(data.enddatatime as [string, string], 'deadline');
  serializeRange(data.performtime as [string, string], 'order');

  return params;
}