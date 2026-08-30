import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { requiresAuth: false, screen: 'auth' }
  },
  {
    path: '/workspace',
    name: 'Workspace',
    component: () => import('@/views/Workspace/index.vue'),
    meta: { requiresAuth: true, screen: 'workspace', adminOnly: false }
  },
  {
    path: '/check/:nfcId?',
    name: 'NfcCheck',
    component: () => import('@/views/NfcCheck/index.vue'),
    meta: { requiresAuth: true, screen: 'nfc', adminOnly: false }
  },
  {
    path: '/',
    redirect: '/dashboard',
    meta: { requiresAuth: true, screen: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { requiresAuth: true, screen: 'admin', adminOnly: true }
      },
      {
        path: 'point',
        name: 'PointManage',
        component: () => import('@/views/Point/index.vue'),
        meta: { requiresAuth: true, screen: 'admin', adminOnly: true }
      },
      {
        path: 'record',
        name: 'RecordList',
        component: () => import('@/views/Record/index.vue'),
        meta: { requiresAuth: true, screen: 'admin', adminOnly: false }
      },
      {
        path: 'stat',
        name: 'PointStat',
        component: () => import('@/views/PointStat/index.vue'),
        meta: { requiresAuth: true, screen: 'admin', adminOnly: true }
      },
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/User/index.vue'),
        meta: { requiresAuth: true, screen: 'admin', adminOnly: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile/index.vue'),
        meta: { requiresAuth: true, screen: 'admin', adminOnly: false }
      },
      {
        path: 'password',
        name: 'ChangePassword',
        component: () => import('@/views/Password/index.vue'),
        meta: { requiresAuth: true, screen: 'admin', adminOnly: false }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = getToken()

  if (to.meta.requiresAuth !== false && !token) {
    const redirect = encodeURIComponent(to.fullPath)
    return next(`/login?redirect=${redirect}`)
  }

  if (to.path === '/login' && token) {
    if (to.query.redirect) {
      const redirect = decodeURIComponent(String(to.query.redirect))
      if (redirect.startsWith('/')) {
        return next(redirect)
      }
    }
    const userStore = useUserStore()
    const role = userStore.userInfo?.role
    return next(role === 1 ? '/dashboard' : '/workspace')
  }

  if (token) {
    const userStore = useUserStore()
    const role = userStore.userInfo?.role
    const isInspector = role !== undefined && role !== 1
    const inAdminLayout = to.matched.some(r => r.meta.screen === 'admin')

    if (isInspector && inAdminLayout) {
      return next('/workspace')
    }

    if (to.path === '/' || to.path === '') {
      return next(isInspector ? '/workspace' : '/dashboard')
    }
  }

  next()
})

export default router
