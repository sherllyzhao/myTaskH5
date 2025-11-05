import { getTypeName, getTotalMoney, getBaseCommission, getAddCommission } from './map';
import { removeTime } from './tool';
import { isProject, showChangeTag} from './map';

/**
 * 生成任务卡片的 HTML 模板
 * 此函数可在服务器端和客户端共享使用
 */
export function createTaskCardHTML(task: any): string {
  // 计算动态数据
  const typeName = getTypeName(task.orderType);
  const totalMoney = getTotalMoney(task);
  const baseCommission = getBaseCommission(task);
  const hallMoney = getAddCommission(task);

  // 判断是否为项目，添加对应的 CSS 类
  const isProjectType = isProject(task.orderType);
  const cardTypeClass = isProjectType ? 'card-type-project' : 'card-type-task';

  // 处理可选标签
  const changeTag = showChangeTag(task)
    ? `<span class="tag tag-changes">🔄 有变更</span>`
    : '';
  const buttonInfoTag = task.button_info
    ? `<span class="tag tag-overdue tag-overdue-${task.button_color}">${task.button_info}</span>`
    : '';

  const timeoutTag = task.timeout
    ? `<span class="tag tag-pending-2d">${task.timeout}</span>`
    : '';

  // 处理接单日期（仅在 status > 1 时显示）
  const performTimeRow = task.status > 1
    ? `<div class="task-info-row">
        <span class="task-info-label">📅 接单日期</span>
        <span class="task-info-value">${removeTime(task.performtime) || '-'}</span>
      </div>`
    : '';

  // 处理备注（仅在有内容时显示）
  const descriptionRow = task.description
    ? `<div class="task-info-row">
        <span class="task-info-label">💡 备注</span>
        <span class="task-info-value">${task.description}</span>
      </div>`
    : '';

  return `
    <div class="task-card card ${cardTypeClass}">
      <div class="task-badge status-${task.statusInfo || '待接单'}">💼 ${task.statusInfo || '待接单'}</div>
      <div class="task-title">接取后可见项目全称</div>

      <div class="task-tags">
        ${changeTag}
        ${buttonInfoTag}
        ${timeoutTag}
      </div>

      <div class="task-info">
        <div class="task-info-row">
          <span class="task-info-label">📋 ${typeName}类型</span>
          <span class="task-info-value">${task.hallTypeTitle || '-'}</span>
        </div>
        <div class="task-info-row">
          <span class="task-info-label">📅 开始日期</span>
          <span class="task-info-value">${removeTime(task.ordertime) || '-'}</span>
        </div>
        ${performTimeRow}
        <div class="task-info-row">
          <span class="task-info-label">⏰ 截止日期</span>
          <span class="task-info-value">${task.enddatatime || '-'}</span>
        </div>
        <div class="task-info-row">
          <span class="task-info-label">⚡ 工期</span>
          <span class="task-info-value">${task.hall_duration || '0'}个工作日</span>
        </div>
      </div>

      <div class="task-salary">
        <div class="salary-item">
          <div class="salary-label">💰 总佣金</div>
          <div class="salary-value">¥ ${totalMoney}</div>
        </div>
        <div class="salary-item">
          <div class="salary-label">💰 基础佣金</div>
          <div class="salary-value">¥ ${baseCommission}</div>
        </div>
        <div class="salary-item">
          <div class="salary-label">💰 加价佣金</div>
          <div class="salary-value">¥ ${hallMoney}</div>
        </div>
      </div>

      ${descriptionRow}

      <div class="task-actions">
        <button
          class="btn btn-primary"
          onclick="handleTaskAccept(event, ${task.id}, '${task.company_id || ''}', '${task.company || ''}', '${task}')"
          data-task-id="${task.id}"
          data-company-id="${task.company_id || ''}"
          data-company-name="${task.company_name || ''}"
        >🚀 立即接取</button>
        <a href="/task/${task.id}/" class="btn btn-secondary">👁️ 查看详情</a>
      </div>
    </div>
  `.trim();
}
