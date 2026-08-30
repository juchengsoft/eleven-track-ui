import request from '@/utils/request'

export function getDashboardStat() {
  return request.get('/api/dashboard/stat')
}