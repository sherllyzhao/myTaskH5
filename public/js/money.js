function isProject(type) {
    return type === 2;
}

function getTotalMoney(task) {
    if (isProject(task.orderType)) {
        return (Number(task.bountymoney) + Number(task.hall_money)).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    if (Number(task.hall_user_money)){
        return Number(task.hall_user_money).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    return (Number(task.bountymoney) + Number(task.hall_money)).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})
}

function getUserList(taskUserList){
    if (taskUserList) {
        let list = taskUserList.map((v) => v.username)
        return list.length ? list.join('、') : ''
    } else {
        return ''
    }
}
