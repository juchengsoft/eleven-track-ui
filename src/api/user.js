import request from '@/utils/request'

export function getUserList(params) {
  return request.get('/api/user/list', { params })
}

export function addUser(data) {
  return request.post('/api/user/add', data)
}

export function updateUser(data) {
  return request.put('/api/user/update', data)
}

export function changeUserStatus(data) {
  return request.put('/api/user/status', data)
}

export function deleteUser(id) {
  return request.delete(`/api/user/${id}`)
}

export function resetUserPwd(data) {
  return request.put('/api/user/resetPwd', data)
}

export function getProfile() {
  return request.get('/api/user/profile')
}

export function changePassword(data) {
  return request.put('/api/user/password', data)
}

export function updateProfile(data) {
  return request.put('/api/user/profile', data)
}

export function getDepSelect() {
  return request.get('/api/user/dep')
}
