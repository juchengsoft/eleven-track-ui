import request from '@/utils/request'

export function getPointStatDetail(id) {
  return request.get(`/api/point-stat/detail/${id}`)
}

export function getPointStatList(params) {
  return request.get('/api/point-stat/list', { params })
}

export function exportPointStat(params) {
  return request.get('/api/point-stat/export', { params, responseType: 'blob' })
}
