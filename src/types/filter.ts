export type FilterItemType = 'input' | 'number' | 'picker' | 'date-time-picker' | 'file';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterItem {
  type: FilterItemType;
  icon: string;
  name: string;
  placeholder?: string;
  width?: 'full' | 'half';
  pickerKey?: string;
  defaultValue?: string;
  accept?: string;
  options?: FilterOption[];
  label?: string;        // 字段标签名称
  showLabel?: boolean;   // 是否显示标签，默认 false
}

export interface FilterGroup {
  title: string;
  items: FilterItem[];
}
