<template>
  <div class="mobile-notice">
    <header class="mn-header">
      <div class="brand">
        <el-icon :size="24"><Promotion /></el-icon>
        <span>荷韵小区巡点通</span>
      </div>
      <div class="user-chip" v-if="userStore.userInfo">
        <el-icon :size="14"><User /></el-icon>
        <span>{{ userStore.userInfo.nickName || userStore.userInfo.username || '管理员' }}</span>
      </div>
    </header>

    <main class="mn-main">
      <section class="tip-card">
        <div class="tip-icon">
          <el-icon :size="44"><Monitor /></el-icon>
        </div>
        <h1 class="tip-title">请在电脑端使用管理后台</h1>
        <p class="tip-desc">
          数据概览、点位管理、账号管理等完整功能为电脑端页面，
          手机屏幕无法正常展示与操作，请在电脑浏览器访问本系统。
        </p>
        <button class="btn-force" @click="enterDesktop">
          <el-icon :size="15"><TopRight /></el-icon>
          <span>我知道了，仍要访问电脑版</span>
        </button>
      </section>

      <section class="entries">
        <div class="entries-title">
          <el-icon :size="15"><Cellphone /></el-icon>
          <span>手机可办事项</span>
        </div>

        <div class="entry-card" @click="go('/audit/repair')">
          <div class="entry-icon entry-icon--teal">
            <el-icon :size="22"><Tools /></el-icon>
          </div>
          <div class="entry-body">
            <div class="entry-name">物业报修管理</div>
            <div class="entry-sub">待派单 · 派单 · 完工验收</div>
          </div>
          <el-icon :size="16" class="entry-arrow"><ArrowRight /></el-icon>
        </div>

        <div class="entry-card" @click="go('/audit/parking')">
          <div class="entry-icon entry-icon--orange">
            <el-icon :size="22"><Van /></el-icon>
          </div>
          <div class="entry-body">
            <div class="entry-name">停车申请审批</div>
            <div class="entry-sub">待审批 · 通过 / 驳回</div>
          </div>
          <el-icon :size="16" class="entry-arrow"><ArrowRight /></el-icon>
        </div>
      </section>
    </main>

    <footer class="mn-footer">
      <span class="logout" @click="handleLogout">
        <el-icon :size="13"><SwitchButton /></el-icon>
        退出登录
      </span>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import {
  Promotion,
  User,
  Monitor,
  TopRight,
  Cellphone,
  Tools,
  Van,
  ArrowRight,
  SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const go = (path) => {
  router.push(path)
}

// 逃生口：本次浏览器会话内不再拦截 PC 后台
const enterDesktop = () => {
  sessionStorage.setItem('forceDesktop', '1')
  router.replace('/dashboard')
}

const handleLogout = () => {
  sessionStorage.removeItem('forceDesktop')
  userStore.logout?.()
  router.replace('/login')
}
</script>

<style scoped lang="scss">
.mobile-notice {
  min-height: 100vh;
  background: linear-gradient(180deg, #0d9488 0%, #0f766e 32%, #f5f7fa 32%, #f5f7fa 100%);
  padding-bottom: 32px;
}

.mn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 20px;
  color: #fff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
}

.mn-main {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-card {
  background: #fff;
  border-radius: 16px;
  padding: 26px 22px 22px;
  text-align: center;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
}

.tip-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d9488;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
}

.tip-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1d2939;
}

.tip-desc {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.btn-force {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1px solid #99f6e4;
  background: #fff;
  color: #0d9488;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:active { background: #f0fdfa; }
}

.entries-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475467;
  padding: 0 4px;
}

.entry-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.15s;

  &:active { transform: scale(0.98); }
}

.entry-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--teal {
    color: #0d9488;
    background: #f0fdfa;
  }

  &--orange {
    color: #ea580c;
    background: #fff7ed;
  }
}

.entry-body {
  flex: 1;
  min-width: 0;
}

.entry-name {
  font-size: 15px;
  font-weight: 600;
  color: #1d2939;
}

.entry-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #98a2b3;
}

.entry-arrow {
  color: #c9cdd4;
  flex-shrink: 0;
}

.mn-footer {
  margin-top: 28px;
  text-align: center;
}

.logout {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #98a2b3;
  cursor: pointer;

  &:active { color: #667085; }
}
</style>
