import request from '@/utils/request'

export function submitRepairOrder(data) {
  return request({
    url: '/api/repair/submit',
    method: 'post',
    data
  })
}

export function queryRepairByPhone(contactPhone) {
  return request({
    url: '/api/repair/query',
    method: 'post',
    data: { contactPhone }
  })
}

export function getRepairByOrderNo(orderNo) {
  return request({
    url: `/api/repair/queryByNo/${orderNo}`,
    method: 'get'
  })
}

export function uploadRepairImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/repair/upload',
    method: 'post',
    timeout: 30000,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function getRepairList(params) {
  return request({
    url: '/api/repair/list',
    method: 'post',
    data: params
  })
}

export function getRepairDetail(id) {
  return request({
    url: `/api/repair/detail/${id}`,
    method: 'get'
  })
}

export function deleteRepairOrder(id) {
  return request.delete(`/api/repair/delete/${id}`)
}

export function exportRepairList(params) {
  return request.get('/api/repair/export', { params, responseType: 'blob' })
}

export function getRepairAuditList(params) {
  return request({
    url: '/api/repair/auditList',
    method: 'post',
    data: params
  })
}

export function getRepairWorkers() {
  return request({
    url: '/api/repair/workers',
    method: 'get'
  })
}

export function dispatchRepair(data) {
  return request({
    url: '/api/repair/dispatch',
    method: 'post',
    data
  })
}

export function acceptRepair(data) {
  return request({
    url: '/api/repair/accept',
    method: 'post',
    data
  })
}

export function getRepairWorkerList(params) {
  return request({
    url: '/api/repair/workerList',
    method: 'post',
    data: params
  })
}

export function delayRepair(data) {
  return request({
    url: '/api/repair/delay',
    method: 'post',
    data
  })
}

export function completeRepair(data) {
  return request({
    url: '/api/repair/complete',
    method: 'post',
    data
  })
}
