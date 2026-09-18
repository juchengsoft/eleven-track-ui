export const REPAIR_STATUS = {
  PENDING_REVIEW: 1,
  REVIEW_REJECT: 2,
  PENDING_DISPATCH: 3,
  REPAIRING: 4,
  PENDING_ACCEPT: 5,
  COMPLETED: 6,
  ACCEPT_REJECT: 7
}

const STATUS_TEXT_MAP = {
  1: '待审核',
  2: '审核驳回',
  3: '待派单',
  4: '维修中',
  5: '待验收',
  6: '已完成',
  7: '验收驳回'
}

const STATUS_TAG_MAP = {
  1: 'info',
  2: 'danger',
  3: 'warning',
  4: 'primary',
  5: 'warning',
  6: 'success',
  7: 'danger'
}

export const getRepairStatusText = (val) => STATUS_TEXT_MAP[val] || '未知'

export const getRepairStatusTagType = (val) => STATUS_TAG_MAP[val] || 'info'

export const getOperateTypeText = (type) => {
  const map = {
    submit: '提交报修',
    dispatch: '派单',
    delay: '延期说明',
    complete: '维修完工',
    accept: '业主验收',
    reject: '验收驳回',
    audit: '审核'
  }
  return map[type] || type || '—'
}

export const formatRepairTime = (t) => {
  if (!t) return '—'
  return String(t).replace('T', ' ').slice(0, 16)
}
