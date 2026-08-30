import request from '@/utils/request'

export function getRecordList(params) {
  return request.get('/api/record/list', { params })
}

export function getRecordDetail(id) {
  return request.get(`/api/record/detail/${id}`)
}

export function exportRecord(params) {
  return request.get('/api/record/export', { params, responseType: 'blob' })
}

export function getPointSelect() {
  return request.get('/api/record/point')
}

export function getUserSelect() {
  return request.get('/api/record/user')
}
