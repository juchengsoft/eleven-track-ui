import request from '@/utils/request'

export function getDashboardStat(queryDate) {
  return request({
    url: '/api/dashboard/stat',
    method: 'get',
    params: { queryDate }
  })
}