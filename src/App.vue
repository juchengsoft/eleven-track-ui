<template>
  <router-view v-if="isFullScreen"/>
  <el-container v-else style="height:100vh">
    <el-aside :width="collapsed ? '64px' : '220px'" class="app-aside">
      <div class="logo">
        <el-icon class="logo-icon" size="28"><Promotion /></el-icon>
        <transition name="fade">
          <span v-show="!collapsed">荷韵小区巡点通</span>
        </transition>
      </div>
      <el-menu
        class="side-menu"
        :default-active="$route.path"
        :collapse="collapsed"
        active-text-color="#fff"
        background-color="#304156"
        text-color="#bfcbd9"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <template #title>数据概览</template>
        </el-menu-item>
        <el-menu-item index="/point">
          <el-icon><Location /></el-icon>
          <template #title>点位管理</template>
        </el-menu-item>
        <el-menu-item index="/record">
          <el-icon><Document /></el-icon>
          <template #title>巡检记录</template>
        </el-menu-item>
        <el-menu-item index="/stat">
          <el-icon><DataBoard /></el-icon>
          <template #title>点位统计</template>
        </el-menu-item>
        <el-menu-item index="/parking">
          <el-icon><Van /></el-icon>
          <template #title>停车申请</template>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <template #title>账号管理</template>
        </el-menu-item>
      </el-menu>
      <el-tooltip
        :content="'退出登录'"
        placement="right"
        :disabled="!collapsed"
      >
        <div class="aside-logout" :class="{ 'is-collapsed': collapsed }" @click="handleAsideLogout">
          <el-icon><SwitchButton /></el-icon>
          <template v-if="!collapsed">
            <span>退出登录</span>
          </template>
        </div>
      </el-tooltip>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <el-tooltip :content="collapsed ? '展开菜单' : '收起菜单'" placement="bottom">
          <el-button
            circle
            :icon="collapsed ? Expand : Fold"
            @click="toggleCollapse"
            class="collapse-btn"
          />
        </el-tooltip>
        <el-dropdown class="header-user" @command="handleDropdownCommand" trigger="click">
          <div class="user-area">
            <el-icon class="user-avatar" size="20"><Avatar /></el-icon>
            <span class="user-name">{{ userStore.userInfo?.nickName || '管理员' }}</span>
            <el-icon class="dropdown-arrow" size="12"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item command="password">
                <el-icon><Lock /></el-icon>
                修改密码
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main style="background:#f2f3f5;padding:15px">
        <router-view/>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { Monitor, Location, Document, User, Promotion, Avatar, SwitchButton, ArrowDown, Lock, Fold, Expand, DataBoard, Van } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const collapsed = ref(false)

const isFullScreen = computed(() => {
  return route.path === '/login'
    || route.path.startsWith('/check')
    || route.path.startsWith('/apply')
    || route.path.startsWith('/audit')
    || route.path === '/workspace'
})

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const doLogout = () => {
  userStore.logout()
  router.push('/login')
}

const handleAsideLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出当前登录账号吗？', '退出提示', {
      confirmButtonText: '确定退出',
      cancelButtonText: '取消',
      type: 'warning'
    })
    doLogout()
  } catch (_) {}
}

const handleDropdownCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出当前登录账号吗？', '退出提示', {
        confirmButtonText: '确定退出',
        cancelButtonText: '取消',
        type: 'warning'
      })
      doLogout()
    } catch (_) {}
  } else if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'password') {
    router.push('/password')
  }
}
</script>

<style scoped lang="scss">
.app-aside {
  background: #304156;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
  overflow: hidden;

  .logo-icon {
    color: #409eff;
    flex-shrink: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.side-menu {
  flex: 1;
  overflow-y: auto;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);

  &:not(.el-menu--collapse) {
    width: 220px;
  }
}

.aside-logout {
  flex-shrink: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #bfcbd9;
  font-size: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #263445;
    color: #fff;
  }

  &.is-collapsed {
    gap: 0;
  }

  .el-icon {
    font-size: 18px;
  }
}

.app-header {
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  gap: 12px;

  .collapse-btn {
    background: #f5f7fa;
    border: 1px solid #ebeef5;
    color: #606266;

    &:hover {
      background: #ecf5ff;
      border-color: #409eff;
      color: #409eff;
    }
  }

  .header-user {
    margin-left: auto;
  }

  .user-area {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f5f7fa;
    }

    .user-avatar {
      color: #909399;
    }

    .user-name {
      color: #303133;
      font-size: 14px;
    }

    .dropdown-arrow {
      color: #909399;
      transition: transform 0.2s;
    }
  }
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu--collapse) {
  width: 64px;
}

:deep(.el-menu-item) {
  position: relative;
  height: 50px;
  line-height: 50px;
  margin: 2px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.06) !important;
  }

  &.is-active {
    background-color: #409EFF !important;
    color: #fff !important;

    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 22px;
      border-radius: 0 3px 3px 0;
      background-color: #fff;
    }

    .el-icon {
      color: #fff !important;
    }
  }
}

:deep(.el-menu--collapse .el-menu-item) {
  margin: 2px;
  width: 60px;
  height: 50px;
  line-height: 50px;
  text-align: center;

  &.is-active::before {
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 22px;
    border-radius: 0 3px 3px 0;
  }
}

:deep(.el-menu--collapse .el-menu-item .el-icon) {
  font-size: 20px;
}
</style>
