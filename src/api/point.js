import request from '@/utils/request'

export function getPointList(params) {
  return request({
    url: '/api/point/list',
    method: 'post',
    data: params
  })
}

export function addPoint(data) {
  return request({
    url: '/api/point/add',
    method: 'post',
    data
  })
}

export function updatePoint(data) {
  return request({
    url: '/api/point/update',
    method: 'post',
    data
  })
}

export function deletePoint(id) {
  return request.delete(`/api/point/delete/${id}`)
}

export function changePointStatus(data) {
  return request({
    url: '/api/point/changeStatus',
    method: 'post',
    data
  })
}