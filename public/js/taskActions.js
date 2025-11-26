/**
 * 立即接取任务
 * @param {string|number} taskId - 任务ID
 * @param {string|number} oid - 订单ID (可选)
 */
async function acceptTask(taskId, oid = '') {
  if (!taskId) {
    console.error('任务ID不能为空');
    return;
  }

  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/taskorder/accept',
        id: taskId,
        oid: oid
      }),
    });

    const result = await response.json();

    if (result.code === 1) {
      // 接取成功，刷新页面
      window.location.reload();
    } else if (result.code === 401) {
      // 未授权，跳转到登录页
      window.location.href = '/login';
    } else {
      // 显示错误信息
      alert(result.msg || '接取失败，请重试');
    }
  } catch (error) {
    console.error('接取任务失败:', error);
    alert('网络错误，请重试');
  }
}