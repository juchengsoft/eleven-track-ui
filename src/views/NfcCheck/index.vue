<template>
  <div class="mobile-nfc">
    <header class="nfc-header">
      <div class="nfc-header__top">
        <div class="brand">
          <el-icon :size="24"><Promotion /></el-icon>
          <span>荷韵巡点通</span>
        </div>
        <div class="status-bar">
          <span class="status-dot"></span>
          {{ isOnline ? '在线' : '离线' }}
        </div>
      </div>
      <div class="nfc-header__title">
        <el-icon :size="20"><Reading /></el-icon>
        <span>巡检打卡</span>
      </div>
    </header>

    <main class="nfc-main">
      <section class="hero-section" :class="{ 'has-point': currentPoint.id }">
        <div class="hero-icon" :class="heroStateClass">
          <el-icon :size="44">
            <Loading v-if="heroState === 'loading'" />
            <CircleCheck v-else-if="heroState === 'ready' || heroState === 'success'" />
            <Warning v-else-if="heroState === 'error'" />
            <Connection v-else />
          </el-icon>
        </div>
        <p class="hero-text">{{ heroText }}</p>
        <p class="hero-tip">{{ heroTip }}</p>
      </section>

      <section class="success-panel" v-if="heroState === 'success'">
        <div class="success-panel__ring">
          <el-icon :size="52"><Finished /></el-icon>
        </div>
        <h2 class="success-panel__title">打卡成功</h2>
        <p class="success-panel__point">{{ lastCheckPoint }}</p>
        <p class="success-panel__time">{{ lastCheckTime }}</p>
        <div class="success-panel__actions">
          <button class="btn-back" @click="goWorkspace">
            <el-icon :size="16"><House /></el-icon>
            <span>返回工作台</span>
          </button>
          <p class="success-panel__hint">巡检完成，可直接关闭本页面</p>
        </div>
      </section>

      <section class="info-section" v-if="heroState !== 'success'">
        <div class="info-grid" :class="{ 'has-point': currentPoint.id }">
          <div class="info-col info-col--location">
            <div class="section-title">
              <el-icon :size="16"><Place /></el-icon>
              <span>定位信息</span>
            </div>
            <div class="location-card">
              <div class="loc-map">
                <div class="loc-map__placeholder">
                  <el-icon :size="32"><MapLocation /></el-icon>
                  <span>定位地图预览</span>
                </div>
                <div
                  v-if="location.ready && !location.error"
                  class="loc-map__pin"
                  :style="{
                    left: '45%',
                    top: '45%'
                  }"
                >
                  <span class="pin-dot"></span>
                  <span class="pin-pulse"></span>
                </div>
              </div>
              <div class="loc-info">
                <div class="loc-status">
                  <el-icon :class="locStatusClass" :size="16">
                    <Loading v-if="!location.ready && !location.error" />
                    <CircleCheck v-else-if="location.ready" />
                    <Warning v-else />
                  </el-icon>
                  <span>{{ locationStatus }}</span>
                </div>
                <div class="loc-coords" v-if="location.ready">
                  <div class="coord-item">
                    <span class="coord-label">经度</span>
                    <span class="coord-value">{{ location.longitude }}</span>
                  </div>
                  <div class="coord-item">
                    <span class="coord-label">纬度</span>
                    <span class="coord-value">{{ location.latitude }}</span>
                  </div>
                </div>
                <div class="loc-error" v-else-if="location.error">
                  {{ location.error }}
                </div>
              </div>
              <button class="retry-btn" @click="getLocation">
                <el-icon :size="14"><Refresh /></el-icon>
                <span>{{ location.ready ? '刷新定位' : '重新获取定位' }}</span>
              </button>
            </div>
          </div>

          <div class="info-col info-col--point" v-if="currentPoint.id">
            <div class="section-title">
              <el-icon :size="16"><Location /></el-icon>
              <span>点位信息</span>
            </div>
            <div class="point-card">
              <div class="point-name">{{ currentPoint.pointName }}</div>
              <div class="point-info-row">
                <el-icon :size="14"><Grid /></el-icon>
                <span>{{ currentPoint.area }}</span>
              </div>
              <div class="point-info-row">
                <el-icon :size="14"><MapLocation /></el-icon>
                <span>{{ currentPoint.address }}</span>
              </div>
              <div class="point-info-row">
                <el-icon :size="14"><User /></el-icon>
                <span>{{ userInfo.value.nickName }}</span>
              </div>
              <div class="point-tag">
                <el-tag type="success" effect="dark" round size="small">NFC 已绑定</el-tag>
              </div>
            </div>

            <div class="remark-section">
              <div class="remark-label">
                <el-icon :size="14"><EditPen /></el-icon>
                <span>巡检备注（选填）</span>
              </div>
              <textarea
                v-model="remark"
                class="remark-input"
                placeholder="描述巡检情况，如设备运行状态、异常情况等"
                maxlength="200"
                rows="3"
              />
              <span class="remark-count">{{ remark.length }}/200</span>
            </div>
          </div>
        </div>
      </section>

      <section class="submit-section" v-if="heroState !== 'success' && currentPoint.id">
        <button
          class="submit-btn"
          :disabled="submitting"
          :class="{ loading: submitting }"
          @click="handleSubmit"
        >
          <template v-if="submitting">
            <span class="spinner"></span>
            <span>提交中...</span>
          </template>
          <template v-else>
            <el-icon :size="22"><CircleCheck /></el-icon>
            <span>确认打卡</span>
          </template>
        </button>
        <p class="submit-hint">打卡信息将自动上传至服务器</p>
      </section>
    </main>

    <footer class="nfc-footer">
      <span>荷韵小区巡点通 v1.0</span>
    </footer>

    <div class="toast" :class="{ show: showToast }">
      {{ toastMsg }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Promotion,
  Reading,
  Connection,
  Refresh,
  Place,
  Location,
  Grid,
  MapLocation,
  User,
  EditPen,
  CircleCheck,
  Warning,
  Loading,
  House,
  Finished
} from '@element-plus/icons-vue'
import { nfcCheckIn } from '@/api/nfc'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo || {})

const isOnline = ref(navigator.onLine)
const showToast = ref(false)
const toastMsg = ref('')
const submitting = ref(false)
const remark = ref('')
const heroState = ref('idle')

let realNfcPointId = null

const autoCheckInTriggered = ref(false)

const location = reactive({
  ready: false,
  longitude: '',
  latitude: '',
  error: ''
})

const currentPoint = reactive({
  id: null,
  pointName: '',
  area: '',
  address: '',
  responsibleUid: null
})

const lastCheckPoint = ref('')
const lastCheckTime = ref('')
const distanceMeter = ref(null)

let toastTimer = null

const heroStateClass = computed(() => ({
  'is-loading': heroState.value === 'loading',
  'is-ready': heroState.value === 'ready',
  'is-success': heroState.value === 'success',
  'is-error': heroState.value === 'error'
}))

const heroText = computed(() => {
  if (heroState.value === 'loading') return '正在识别点位...'
  if (heroState.value === 'ready') return '请核对信息并确认打卡'
  if (heroState.value === 'success') return '打卡已完成'
  if (heroState.value === 'error') return '点位识别失败'
  return '请通过 NFC 标签进入打卡'
})

const heroTip = computed(() => {
  if (heroState.value === 'loading') return ''
  if (heroState.value === 'ready') {
    if (distanceMeter.value !== null) {
      return `当前距离点位：${distanceMeter.value.toFixed(1)}米，请确认位置`
    }
    return '核对信息后点击确认打卡'
  }
  if (heroState.value === 'success') return '本次巡检记录已保存'
  if (heroState.value === 'error') return '点位识别失败，请重新贴近NFC标签扫码'
  return '将手机背面贴近巡检点 NFC 标签即可打卡'
})

const locationStatus = computed(() => {
  if (location.error) return '定位失败'
  if (location.ready) return '定位成功'
  return '定位中...'
})

const locStatusClass = computed(() => {
  if (location.error) return 'is-error'
  if (location.ready) return 'is-success'
  return 'is-loading'
})

const showMsg = (msg) => {
  toastMsg.value = msg
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 2000)
}

const checkLogin = () => {
  if (!userStore.token) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search)
    router.replace(`/login?redirect=${redirect}`)
    return false
  }
  return true
}

const goWorkspace = () => {
  router.replace('/workspace')
}

const getLocation = () => {
  location.ready = false
  location.error = ''
  if (!navigator.geolocation) {
    location.error = '当前浏览器不支持定位'
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      location.longitude = pos.coords.longitude.toFixed(6)
      location.latitude = pos.coords.latitude.toFixed(6)
      location.ready = true
    },
    (err) => {
      location.error = err.code === 1 ? '请开启定位权限' : '定位失败，请重试'
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

const resetPoint = () => {
  Object.assign(currentPoint, {
    id: null,
    pointName: '',
    area: '',
    address: '',
    responsibleUid: null
  })
  distanceMeter.value = null
}

const handleSubmit = async () => {
  if (!realNfcPointId) {
    showMsg('未获取点位ID，请重新扫描NFC标签')
    return
  }
  if (!location.ready) {
    showMsg('请先获取定位信息')
    return
  }

  submitting.value = true
  heroState.value = 'loading'
  resetPoint()

  try {
    const res = await nfcCheckIn({
      pointId: realNfcPointId,
      longitude: location.longitude,
      latitude: location.latitude,
      deviceInfo: navigator.userAgent.slice(0, 200),
      remark: remark.value.trim(),
      depId: userInfo.value.depId ?? null
    })
    const data = res.data

    if (data.success) {
      currentPoint.id = realNfcPointId
      currentPoint.pointName = data.pointName
      currentPoint.area = data.area
      currentPoint.address = data.address
      currentPoint.responsibleUid = data.userId ?? null
      distanceMeter.value = data.distanceMeter

      lastCheckPoint.value = data.pointName
      lastCheckTime.value = String(data.checkTime).replace('T', ' ')
      remark.value = ''
      heroState.value = 'success'
      showMsg('打卡成功')
    } else {
      heroState.value = 'error'
      showMsg(data.msg)
    }
  } catch (err) {
    console.error('打卡请求异常', err)
    heroState.value = 'error'
    showMsg('网络异常，打卡请求失败')
  } finally {
    submitting.value = false
  }
}

function initMixPointId() {
  const rawId = route.params.nfcId
  if (!rawId || !/^\d+$/.test(rawId)) {
    if (!realNfcPointId) {
      heroState.value = 'idle'
    }
    return
  }

  realNfcPointId = Number(rawId)

  const mixStr = Math.random().toString(36).slice(2) + Date.now()
  const newPath = `/check/${mixStr}`
  history.replaceState({}, document.title, newPath)

  function clearMemoryPointId() {
    realNfcPointId = null
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearMemoryPointId()
    }
  })
  window.addEventListener('beforeunload', clearMemoryPointId)
}

watch(
  () => location.ready,
  (ready) => {
    if (!ready) return
    if (!realNfcPointId) return
    if (autoCheckInTriggered.value) return
    if (heroState.value === 'success') return

    autoCheckInTriggered.value = true
    handleSubmit()
  }
)

const handleOnline = () => { isOnline.value = true }
const handleOffline = () => { isOnline.value = false }

onMounted(async () => {
  if (!checkLogin()) return

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  isOnline.value = navigator.onLine

  getLocation()
  initMixPointId()
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped lang="scss">
.mobile-nfc {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a4b8c 0%, #0f2d5c 40%, #f5f7fa 40%, #f5f7fa 100%);
  padding-bottom: 40px;
  position: relative;
}

.nfc-header {
  padding: 16px 20px 24px;
  color: #fff;
}

.nfc-header__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  opacity: 0.85;

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #52c41a;
  }
}

.nfc-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  padding: 12px 0 4px;
}

.nfc-main {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-section {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.hero-icon {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  color: #4a7dff;

  &.is-loading {
    background: #fff7e6;
    color: #faad14;
    animation: heroPulse 1.5s infinite;
  }

  &.is-ready {
    background: #e6f7ea;
    color: #52c41a;
  }

  &.is-success {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    color: #16a34a;
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.1);
  }

  &.is-error {
    background: #fff1f0;
    color: #f5222d;
  }
}

@keyframes heroPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.hero-text {
  font-size: 18px;
  font-weight: 600;
  color: #1d2939;
  margin: 0 0 8px;
}

.hero-tip {
  font-size: 13px;
  color: #667085;
  margin: 0;
}

.success-panel {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 50%);
  border: 1px solid #bbf7d0;
  border-radius: 18px;
  padding: 28px 24px 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.1);
}

.success-panel__ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.35);
  animation: ringIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes ringIn {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.success-panel__title {
  font-size: 22px;
  font-weight: 700;
  color: #15803d;
  margin: 0 0 8px;
}

.success-panel__point {
  font-size: 15px;
  font-weight: 600;
  color: #1d2939;
  margin: 0 0 4px;
}

.success-panel__time {
  font-size: 12px;
  color: #667085;
  margin: 0 0 20px;
}

.success-panel__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 28px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(34, 197, 94, 0.3);
  }
}

.success-panel__hint {
  margin: 4px 0 0;
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

.info-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
}

.info-col--location,
.info-col--point {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.location-card {
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.point-card {
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.loc-map {
  position: relative;
  height: 140px;
  background: linear-gradient(135deg, #e0f2fe 0%, #ccfbf1 100%);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px);
    background-size: 24px 24px;
  }
}

.loc-map__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #71717a;
  font-size: 12px;
}

.loc-map__pin {
  position: absolute;
  z-index: 2;

  .pin-dot {
    display: block;
    width: 14px;
    height: 14px;
    background: #3b82f6;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  .pin-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 22px;
    height: 22px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.3);
    animation: pinPulse 1.8s infinite;
  }
}

@keyframes pinPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.6);
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.2);
    opacity: 0;
  }
}

.loc-info {
  padding: 12px 16px;
}

.loc-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #344054;
  margin-bottom: 12px;

  .is-loading {
    color: #faad14;
  }
  .is-success {
    color: #52c41a;
  }
  .is-error {
    color: #f5222d;
  }
}

.loc-coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.coord-item {
  background: #f9fafb;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
}

.coord-label {
  display: block;
  color: #98a2b3;
  font-size: 11px;
  margin-bottom: 2px;
}

.coord-value {
  display: block;
  color: #1d2939;
  font-family: 'SF Mono', Menlo, monospace;
  font-weight: 500;
}

.loc-error {
  font-size: 12px;
  color: #f5222d;
  padding: 10px;
  background: #fff2f0;
  border-radius: 6px;
  margin-bottom: 12px;
}

.retry-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 10px;
  background: #f8fafc;
  border: none;
  border-top: 1px solid #f0f0f0;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }
}

.point-name {
  font-size: 17px;
  font-weight: 600;
  color: #1d2939;
  margin-bottom: 10px;
}

.point-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475467;
  padding: 4px 0;
}

.point-tag {
  margin-top: 12px;
}

.remark-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.remark-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #344054;
}

.remark-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;

  &:focus {
    border-color: #4a7dff;
  }
}

.remark-count {
  text-align: right;
  font-size: 11px;
  color: #98a2b3;
}

.submit-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 320px;
  height: 52px;
  margin: 0 auto;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.loading {
    pointer-events: none;
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.submit-hint {
  text-align: center;
  font-size: 12px;
  color: #98a2b3;
  margin: 10px 0 0;
}

.nfc-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 11px;
  color: #98a2b3;
  opacity: 0.8;
}

.toast {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s;
  z-index: 9999;
  white-space: nowrap;

  &.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@media screen and (min-width: 768px) {
  .nfc-main {
    max-width: 600px;
    padding: 0 24px 16px;
    gap: 20px;
  }
}

@media screen and (min-width: 1024px) {
  .mobile-nfc {
    padding-bottom: 60px;
  }

  .nfc-main {
    max-width: 1440px;
    padding: 0 32px 16px;
  }

  .hero-section {
    padding: 36px 40px;
  }

  .hero-icon {
    width: 100px;
    height: 100px;

    :deep(.el-icon) {
      font-size: 48px !important;
    }
  }

  .hero-text {
    font-size: 20px;
  }

  .info-section {
    padding: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 24px;

    &.has-point {
      grid-template-columns: 1fr 1fr;
    }
  }

  .info-col--location,
  .info-col--point {
    display: flex;
    flex-direction: column;
  }

  .info-col--location .location-card {
    flex: 1;
  }

  .loc-map {
    height: 240px;
  }

  .submit-section {
    padding: 24px 20px;
  }

  .submit-btn {
    max-width: 360px;
    height: 56px;
    font-size: 17px;
  }
}
</style>