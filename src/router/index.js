import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/user'
import { isMobile } from '@/utils/device'

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
    meta: { requiresAuth: true, screen: 'workspace', adminOnly: false, roles: [2] }
  },
  {
    path: '/check/:nfcId?',
    name: 'NfcCheck',
    component: () => import('@/views/NfcCheck/index.vue'),
    meta: { requiresAuth: true, screen: 'nfc', adminOnly: false }
  },
  {
    path: '/apply/parking',
    name: 'ParkingGuest',
    component: () => import('@/views/ParkingGuest/index.vue'),
    meta: { requiresAuth: false, screen: 'public', adminOnly: false }
  },
  {
    path: '/audit/parking',
    name: 'ParkingAudit',
    component: () => import('@/views/ParkingAudit/index.vue'),
    meta: { requiresAuth: true, screen: 'public', adminOnly: false, roles: [1, 3] }
  },
  {
    path: '/apply/repair',
    name: 'RepairApply',
    component: () => import('@/views/RepairApply/index.vue'),
    meta: { requiresAuth: false, screen: 'public', adminOnly: false }
  },
  {
    path: '/audit/repair',
    name: 'RepairAudit',
    component: () => import('@/views/RepairAudit/index.vue'),
    meta: { requiresAuth: true, screen: 'public', adminOnly: false, roles: [1, 3] }
  },
  {
    path: '/workbench/repair',
    name: 'RepairWorker',
    component: () => import('@/views/RepairWorker/index.vue'),
    // 仅维修师傅（4）可处理工单
    meta: { requiresAuth: true, screen: 'public', adminOnly: false, roles: [4] }
  },
  {
    path: '/mobile',
    name: 'MobileNotice',
    component: () => import('@/views/MobileNotice/index.vue'),
    meta: { requiresAuth: true, screen: 'public', adminOnly: false }
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
        path: 'parking',
        name: 'ParkingApply',
        component: () => import('@/views/ParkingApply/index.vue'),
        meta: { requiresAuth: true, screen: 'admin', adminOnly: true }
      },
      {
        path: 'repair',
        name: 'Repair',
        component: () => import('@/views/Repair/index.vue'),
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
    const role = getRole(userStore)
    return next(getHomePath(role))
  }

  if (token) {
    const userStore = useUserStore()
    const role = getRole(userStore)
    const inAdminLayout = to.matched.some(r => r.meta.screen === 'admin')

    if (inAdminLayout && (role === 2 || role === 4)) {
      return next(getHomePath(role))
    }

    if (inAdminLayout && isMobile() && !sessionStorage.getItem('forceDesktop')) {
      return next('/mobile')
    }

    if (Array.isArray(to.meta.roles) && !to.meta.roles.includes(role)) {
      return next(getHomePath(role))
    }

    if (to.path === '/' || to.path === '') {
      return next(getHomePath(role))
    }
  }

  next()
})

function getRole (userStore) {
  const r = userStore.userInfo?.role
  const n = Number(r)
  return Number.isNaN(n) ? r : n
}

function getHomePath (role) {
  if (role === 2) return '/workspace'
  if (role === 4) return '/workbench/repair'
  return isMobile() ? '/mobile' : '/dashboard'
}

export default router
