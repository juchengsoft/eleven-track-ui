import request from '@/utils/request'

export function getParkingApplyList(params) {
  return request({
    url: '/api/parkingApply/list',
    method: 'post',
    data: params
  })
}

export function deleteParkingApply(id) {
  return request.delete(`/api/parkingApply/delete/${id}`)
}

export function submitParkingApply(data) {
  return request({
    url: '/api/parkingApply/submit',
    method: 'post',
    data
  })
}
