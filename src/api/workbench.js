import request from '@/utils/request'

export function getWorkbenchSummary() {
  return request({
    url: '/api/workbench/getSummary',
    method: 'get'
  })
}