export const receiveStatusMap: Record<number, { text: string; color: string }> = {
    0: { text: '待接取', color: '#f08b25' },
    1: { text: '制作中', color: '#d7000f' },
    2: { text: '待验收', color: '#f08b25' },
    3: { text: '完结申请中', color: '#3b9b4f' },
    4: { text: '已完成', color: '#3b9b4f' },
};
export const receiveStatusStrMap: Record<string, string> = {
    待接单: '#fa367a',
    已接单: '#f08b25',
    发布中: '#fa367a',
    已发布: '#fa367a',
    已逾期: '#d7000f',
    核对中: '#409eff',
    待质检: '#409eff',
    已完结: '#3b9b4f',
    已驳回: '#d7000f',
};

export function receiveStatusClass(val: [string, number], data: {statusInfo: string}) {
    if (data && data.statusInfo) {
        return receiveStatusStrMap[data.statusInfo]
    } else {
        return receiveStatusMap[val[1]]?.color
    }
}