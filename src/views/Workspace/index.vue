<template>
  <div class="workspace">
    <header class="ws-header">
      <div class="ws-header__top">
        <div class="brand">
          <el-icon :size="26"><Promotion /></el-icon>
          <span>荷韵巡点通</span>
        </div>
        <el-dropdown @command="handleCommand" trigger="click">
          <div class="user-chip">
            <el-avatar :size="34" class="user-avatar">{{ initial }}</el-avatar>
            <span class="user-name">{{ displayName }}</span>
            <el-icon :size="14" class="caret"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="ws-header__welcome">
        <p class="greet">{{ greetText }}，{{ shortName }} 👋</p>
        <p class="status-line">
          <span class="dot ok"></span>
          您已登录，可以开始巡检工作
        </p>
      </div>
    </header>

    <main class="ws-main">
      <section class="stat-row">
        <div class="stat-card today">
          <div class="stat-icon">
            <el-icon :size="26"><Finished /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ todayChecked }}<span class="stat-unit">/{{ todayTotal }} 点位</span></div>
            <div class="stat-label">今日巡检进度</div>
          </div>
          <div class="stat-progress">
            <div class="stat-progress__bar" :style="{ width: progressWidth }"></div>
          </div>
        </div>
        <div class="stat-card streak">
          <div class="stat-icon">
            <el-icon :size="26"><Sunny /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ streakDays }}<span class="stat-unit">天</span></div>
            <div class="stat-label">连续打卡</div>
          </div>
          <div class="streak-badge">保持加油 🔥</div>
        </div>
      </section>

      <section class="nfc-card">
        <div class="nfc-card__icon">
          <div class="pulse p1"></div>
          <div class="pulse p2"></div>
          <div class="pulse p3"></div>
          <div class="nfc-core">
            <el-icon :size="48"><Connection /></el-icon>
          </div>
        </div>
        <h2 class="nfc-card__title">扫描 NFC 标签开始打卡</h2>
        <p class="nfc-card__tip">将手机背面贴近巡检点的 NFC 标签，系统将自动识别点位并完成打卡</p>
        <div class="nfc-steps">
          <div class="nfc-steps__item">
            <div class="step-no">1</div>
            <p>解锁手机并保持亮屏</p>
          </div>
          <div class="nfc-steps__arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="nfc-steps__item">
            <div class="step-no">2</div>
            <p>背面贴近点位标签</p>
          </div>
          <div class="nfc-steps__arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="nfc-steps__item">
            <div class="step-no">3</div>
            <p>确认信息并完成打卡</p>
          </div>
        </div>
        <p class="nfc-card__hint">首次使用请确认手机已开启 NFC 功能</p>
      </section>

      <section class="recent-section">
        <div class="section-title">
          <el-icon :size="16"><Clock /></el-icon>
          <span>最近打卡</span>
        </div>
        <div class="recent-list" v-if="recentList.length > 0">
          <div
            v-for="item in recentList"
            :key="item.id"
            class="recent-item"
          >
            <div class="recent-dot" :class="'s' + item.checkStatus"></div>
            <div class="recent-body">
              <div class="recent-name">{{ item.pointName }}</div>
              <div class="recent-meta">
                <el-icon :size="12"><Place /></el-icon>
                <span>{{ item.area }}</span>
                <span class="dot-sep"></span>
                <span>{{ formatTime(item.checkTime) }}</span>
              </div>
            </div>
            <el-tag
              :type="getStatusType(item.checkStatus)"
              size="small"
              effect="light"
              round
            >{{ getStatusText(item.checkStatus) }}</el-tag>
          </div>
        </div>
        <div class="recent-empty" v-else>
          <el-icon :size="32"><CircleClose /></el-icon>
          <span>暂无打卡记录，开始您的第一次巡检吧～</span>
        </div>
      </section>
    </main>

    <footer class="ws-footer">
      <span>荷韵小区巡点通 v1.0 · 巡检员工作台</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  ArrowDown,
  SwitchButton,
  Finished,
  Sunny,
  Connection,
  Clock,
  Place,
  CircleClose,
  Promotion
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { getWorkbenchSummary } from '@/api/workbench'

const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo || {})
const displayName = computed(() => userInfo.value.nickName || userInfo.value.username || '巡检员')
const shortName = computed(() => {
  const n = displayName.value
  return n.length <= 3 ? n : n.slice(-3)
})
const initial = computed(() => {
  const n = displayName.value
  return n ? n.charAt(0) : '巡'
})

const hour = new Date().getHours()
const greetText = computed(() => {
  if (hour < 6) return '深夜好'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const todayTotal = ref(0)
const todayChecked = ref(0)
const streakDays = ref(0)
const recentList = ref([])

const progressWidth = computed(() => {
  if (todayTotal.value === 0) return '0%'
  const pct = Math.min(100, Math.round((todayChecked.value / todayTotal.value) * 100))
  return pct + '%'
})

const formatTime = (t) => {
  if (!t) return ''
  return String(t).replace('T', ' ').slice(0, 16)
}

const getStatusType = (s) => {
  if (s === 1) return 'success'
  if (s === 2) return 'warning'
  return 'info'
}

const getStatusText = (s) => {
  if (s === 1) return '正常'
  if (s === 2) return '异常'
  return '漏检'
}

const loadSummary = async () => {
  try {
    const res = await getWorkbenchSummary()
    const data = res.data || {}
    todayTotal.value = data.todayTotal || 0
    todayChecked.value = data.todayChecked || 0
    streakDays.value = data.streakDays || 0
    recentList.value = data.recentList || []
  } catch (err) {
    console.error('工作台数据加载失败：', err)
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出当前登录账号吗？', '退出提示', {
      confirmButtonText: '确定退出',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    router.push('/login')
  } catch {
  }
}

const handleCommand = (cmd) => {
  if (cmd === 'logout') handleLogout()
}

onMounted(() => {
  loadSummary()
})
</script>

<style scoped lang="scss">
.workspace {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a4b8c 0%, #0f2d5c 35%, #f5f7fa 35%, #f5f7fa 100%);
  padding-bottom: 40px;
}

.ws-header {
  padding: 20px 20px 28px;
  color: #fff;
  max-width: 960px;
  margin: 0 auto;
}

.ws-header__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
}

.user-avatar {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  border: 2px solid rgba(255, 255, 255, 0.25);
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  max-width: 80px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caret {
  opacity: 0.7;
}

.ws-header__welcome {
  padding: 18px 4px 0;
}

.greet {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px;
}

.status-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.9;
  margin: 0;

  .dot.ok {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #52c41a;
    box-shadow: 0 0 0 3px rgba(82, 196, 26, 0.2);
  }
}

.ws-main {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-card {
  position: relative;
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  overflow: hidden;

  &.today::after {
    content: '';
    position: absolute;
    top: -40px;
    right: -30px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.02));
  }

  &.streak::after {
    content: '';
    position: absolute;
    top: -40px;
    right: -30px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.12), rgba(251, 146, 60, 0.02));
  }
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  .today & {
    background: #eff6ff;
    color: #3b82f6;
  }

  .streak & {
    background: #fff7ed;
    color: #f97316;
  }
}

.stat-body {
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1d2939;
  line-height: 1.1;
}

.stat-unit {
  font-size: 12px;
  color: #667085;
  font-weight: 500;
  margin-left: 2px;
}

.stat-label {
  font-size: 12px;
  color: #667085;
  margin-top: 4px;
}

.stat-progress {
  margin-top: 14px;
  height: 6px;
  border-radius: 3px;
  background: #f2f4f7;
  overflow: hidden;

  &__bar {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 3px;
    transition: width 0.6s;
  }
}

.streak-badge {
  margin-top: 14px;
  display: inline-block;
  padding: 4px 10px;
  background: #fff7ed;
  color: #ea580c;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
}

.nfc-card {
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  border: 1px solid #dbeafe;
  border-radius: 18px;
  padding: 28px 24px;
  text-align: center;
  box-shadow: 0 4px 18px rgba(59, 130, 246, 0.08);
}

.nfc-card__icon {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  .pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid rgba(59, 130, 246, 0.35);
    animation: nfcPulse 2.4s ease-out infinite;
  }

  .p2 {
    animation-delay: 0.6s;
  }

  .p3 {
    animation-delay: 1.2s;
  }
}

@keyframes nfcPulse {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

.nfc-core {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.nfc-card__title {
  font-size: 19px;
  font-weight: 700;
  color: #1d2939;
  margin: 0 0 8px;
}

.nfc-card__tip {
  font-size: 13px;
  color: #667085;
  margin: 0 auto 20px;
  max-width: 420px;
  line-height: 1.6;
}

.nfc-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 auto;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  border: 1px dashed #bfdbfe;
  max-width: 560px;
  flex-wrap: wrap;
}

.nfc-steps__item {
  display: flex;
  align-items: center;
  gap: 8px;

  p {
    margin: 0;
    font-size: 12px;
    color: #344054;
    font-weight: 500;
    white-space: nowrap;
  }
}

.step-no {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nfc-steps__arrow {
  color: #93c5fd;
  font-size: 14px;

  &:last-child {
    display: none;
  }
}

.nfc-card__hint {
  margin: 16px 0 0;
  font-size: 11px;
  color: #98a2b3;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #344054;
  margin-bottom: 10px;
}

.recent-section {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #f2f4f7;
  border-radius: 10px;
  overflow: hidden;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
}

.recent-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;

  &.s1 {
    background: #22c55e;
  }

  &.s2 {
    background: #f59e0b;
  }

  &.s3 {
    background: #9ca3af;
  }
}

.recent-body {
  flex: 1;
  min-width: 0;
}

.recent-name {
  font-size: 13px;
  font-weight: 600;
  color: #1d2939;
  margin-bottom: 3px;
}

.recent-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #98a2b3;

  .dot-sep {
    width: 3px;
    height: 3px;
    background: #d0d5dd;
    border-radius: 50%;
  }
}

.recent-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 0 24px;
  color: #98a2b3;
  font-size: 12px;
}

.ws-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 11px;
  color: #98a2b3;
  opacity: 0.8;
}

@media screen and (max-width: 640px) {
  .stat-value {
    font-size: 20px;
  }

  .greet {
    font-size: 20px;
  }
}

@media screen and (min-width: 960px) {
  .stat-row {
    gap: 16px;
  }

  .nfc-card {
    padding: 32px 28px;
  }
}
</style>