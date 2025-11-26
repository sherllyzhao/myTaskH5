export const typeNameMap: Record<number, string> = {
    2: '项目',
    1: '任务',
    3: '任务',
}
// 获取对应汉字
export function getTypeName(type: number) {
    return typeNameMap[type] || '未知'
}
// 是否是项目
export function isProject(type: number) {
    return type === 2;
}
// 总佣金
export function getTotalMoney(task: any) {
  if (isProject(task.orderType)) {
    return (Number(task.bountymoney) + Number(task.hall_money)).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }
  if (Number(task.hall_user_money)){
    return Number(task.hall_user_money).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }
  return (Number(task.bountymoney) + Number(task.hall_money)).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})
}
// 基础佣金
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
// 加价佣金
export function getAddCommission(task: any) {
  return Number(task.hall_money).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
// 是否显示变更标签
export function showChangeTag (data: any): boolean{
  let show = false
  if (data && data.orderType && +data.is_change) {
    if (+data.orderType === 2) {
      show = true
    }
  }
  return show
}
// 是否是待接单
export function isWaiting(task: any): boolean {
  return task.statusInfo === "待接单"
}
// 判断是否是旧版本
export function isOldVersion(task: any): boolean {
  return task.orderType === 1
}
/**
 * 区分抢单还是下发
 * @param {Object} row 行数据
 * @returns {Boolean | String}
 */
export function getTaskPublishType(task: any): boolean | string {
  // 判断是否是任务，orderType为1,3是任务，1是已废弃的版本的任务
  if(+task.orderType === 3){
    // 判断有没有项目id，有是项目下的任务，没有是单独发的任务
    if(task.proid === 0){
      return '单独下发'
    }
  }
  return false
}
/**
 * !20240202 工期预警
 * @param {number | string} status
 * @returns
 */
export function earlyWarningOfConstructionPeriod (status: number | string) : string {
  // 根据status参数的值，返回不同的字符串
  if (status) {
    const warnMap: Record<number | string, string> = {
      1: 'blue',
      2: 'green',
      3: 'red'
    }
    return warnMap[status] || ''
  }
  return ''
}
