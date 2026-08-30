import { defineStore } from 'pinia'
import { setToken, getToken, removeToken, setUserInfo, getUserInfo, removeUserInfo } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: getUserInfo()
  }),
  actions: {
    setToken(val) {
      this.token = val
      setToken(val)
    },
    setUserInfo(info) {
      this.userInfo = info
      setUserInfo(info)
    },
    logout() {
      this.token = ''
      this.userInfo = null
      removeToken()
      removeUserInfo()
    }
  }
})