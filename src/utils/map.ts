export const typeNameMap: Record<number, string> = {
    2: '项目',
    1: '任务',
    3: '任务',
}
export function getTypeName(type: number) {
    return typeNameMap[type] || '未知'
}
export function isProject(type: number) {
    return type === 2;
}
export function getTotalMoney(task: any) {
  if (isProject(task.orderType)) {
    return (Number(task.bountymoney) + Number(task.hall_money)).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }
  if (Number(task.hall_user_money)){
    return Number(task.hall_user_money).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }
  return (Number(task.bountymoney) + Number(task.hall_money)).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})
}
export function getBaseCommission(task: any) {
  if (isProject(task.orderType)) {
    return Number(task.bountymoney).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }
  if (Number(task.hall_user_money)){
    return (Number(task.hall_user_money) -
      Number(task.hall_money)).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }
  return Number(task.bountymoney).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})
}
