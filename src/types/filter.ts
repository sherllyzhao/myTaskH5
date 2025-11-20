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
}

export interface FilterGroup {
  title: string;
  items: FilterItem[];
}
