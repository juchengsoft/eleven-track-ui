import axios from 'axios'
import { getToken, removeToken } from './auth'
import { ElMessage } from 'element-plus'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASEURL,
  timeout: 10000
})

let isShow401 = false

service.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

service.interceptors.response.use(
  res => {
    const contentType = res.headers['content-type'] || ''
    if (
      contentType.includes('application/octet-stream') ||
      contentType.includes('application/vnd.openxmlformats')
    ) {
      return res
    }

    const data = res.data
    if (data.code !== 200) {
      ElMessage.warning(data.msg || '操作失败')
      return Promise.reject({
        type: 'business',
        code: data.code,
        message: data.msg || '操作失败',
        raw: data
      })
    }
    return data
  },
  err => {
    const response = err.response
    if (!response) {
      let tipMsg = ''
      if (err.message.includes('timeout')) {
        tipMsg = '请求超时，请检查网络或后端服务'
      } else {
        tipMsg = '无法连接服务器，请确认后端服务已启动'
      }
      ElMessage.error(tipMsg)
      return Promise.reject({ type: 'network', message: tipMsg })
    }
    if (response.status === 401) {
      if (!isShow401) {
        isShow401 = true
        ElMessage.error('登录已过期，请重新登录')
      }
      removeToken()
      router.push('/login')
      setTimeout(() => {
        isShow401 = false
      }, 1500)
      return Promise.reject({ type: 'auth', message: '登录已过期' })
    }
    const msg = response?.data?.msg || err.message || '接口请求失败'
    ElMessage.error(msg)
    return Promise.reject({ type: 'http', message: msg, raw: err })
  }
)

export default service