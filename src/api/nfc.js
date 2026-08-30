import request from '@/utils/request'

export function nfcCheckIn(data) {
  return request({
    url: '/api/nfc/checkIn',
    method: 'post',
    data
  })
}