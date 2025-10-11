export const typeNameMap: Record<number, string> = {
    2: '项目',
    1: '任务',
    3: '任务',
}
export function getTypeName(type: number) {
    return typeNameMap[type] || '未知'
}