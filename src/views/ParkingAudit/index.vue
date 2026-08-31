<template>
  <div class="audit-mobile">
    <header class="au-header">
      <div class="au-header__top">
        <div class="brand">
          <el-icon :size="24"><Promotion /></el-icon>
          <span>荷韵小区巡点通</span>
        </div>
        <div class="user-chip">
          <el-icon :size="14"><User /></el-icon>
          <span>{{ userStore.userInfo?.nickName || '物业人员' }}</span>
        </div>
      </div>
      <div class="au-header__title">
        <el-icon :size="20"><Stamp /></el-icon>
        <span>访客停车审批</span>
      </div>
      <p class="au-header__desc">审核访客提交的临时停车申请，通过后方可入场</p>
    </header>

    <main class="au-main">
      <section class="tab-bar">
        <div
          v-for="t in tabs"
          :key="t.value"
          class="tab-item"
          :class="{ active: activeTab === t.value }"
          @click="switchTab(t.value)"
        >
          <span>{{ t.label }}</span>
          <span v-if="t.value === 0 && pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
        </div>
      </section>

      <div class="apply-list" v-loading="loading">
        <div class="empty-box" v-if="!loading && list.length === 0">
          <el-icon :size="40"><MessageBox /></el-icon>
          <p>{{ emptyText }}</p>
        </div>

        <div class="apply-card" v-for="row in list" :key="row.id">
          <div class="card-top">
            <span class="visitor">{{ row.visitorName }}</span>
            <el-tag size="small" effect="plain" type="warning" round>{{ row.plateNumber }}</el-tag>
            <span class="flex-sp"></span>
            <el-tag size="small" effect="light" round :type="statusType(row.applyStatus)">
              {{ statusText(row.applyStatus) }}
            </el-tag>
          </div>
          <div class="card-rows">
            <div class="row">
              <el-icon :size="13"><Phone /></el-icon>
              <span>{{ row.visitorPhone }}</span>
            </div>
            <div class="row">
              <el-icon :size="13"><UserFilled /></el-icon>
              <span>被访：{{ row.ownerName }} · {{ row.houseNo }}</span>
            </div>
            <div class="row">
              <el-icon :size="13"><Clock /></el-icon>
              <span>{{ formatTime(row.applyStart) }} → {{ formatTime(row.applyEnd) }}</span>
            </div>
            <div class="row" v-if="row.remark">
              <el-icon :size="13"><ChatLineSquare /></el-icon>
              <span class="remark">{{ row.remark }}</span>
            </div>
          </div>
          <div class="card-foot">
            <span class="apply-no">{{ row.applyNo }}</span>
            <span class="ctime">{{ formatTime(row.createTime) }}</span>
          </div>

          <div class="card-actions" v-if="activeTab === 0">
            <button class="btn-reject" @click="openAudit(row, 2)">
              <el-icon :size="14"><CircleClose /></el-icon>
              <span>驳回</span>
            </button>
            <button class="btn-pass" @click="openAudit(row, 1)">
              <el-icon :size="14"><CircleCheck /></el-icon>
              <span>通过</span>
            </button>
          </div>
          <div class="card-audited" v-else-if="row.applyStatus === 1 || row.applyStatus === 2">
            <span>审批人：{{ row.auditUserName || '—' }} · {{ formatTime(row.auditTime) }}</span>
            <span v-if="row.auditRemark" class="audit-remark">意见：{{ row.auditRemark }}</span>
          </div>
        </div>
      </div>

      <div class="load-more" v-if="!loading && list.length < total">
        <button class="btn-more" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
      <p class="list-end" v-else-if="!loading && list.length">— 已全部加载 —</p>
    </main>

    <footer class="au-footer">
      <span>荷韵小区巡点通 · 访客停车审批</span>
    </footer>

    <el-dialog
      v-model="auditVisible"
      :title="auditForm.auditResult === 1 ? '通过申请' : '驳回申请'"
      width="86%"
      :close-on-click-modal="false"
      class="audit-dialog"
    >
      <div class="audit-target">
        <span class="audit-target__name">{{ auditForm.visitorName }}</span>
        <el-tag size="small" type="warning" effect="plain" round>{{ auditForm.plateNumber }}</el-tag>
      </div>
      <el-input
        v-model="auditForm.auditRemark"
        type="textarea"
        :rows="3"
        maxlength="200"
        show-word-limit
        :placeholder="auditForm.auditResult === 1 ? '审批意见（选填）' : '驳回必须填写原因'"
      />
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button
          :type="auditForm.auditResult === 1 ? 'success' : 'danger'"
          :loading="auditLoading"
          @click="confirmAudit"
        >
          {{ auditForm.auditResult === 1 ? '确认通过' : '确认驳回' }}
        </el-button>
      </template>
    </el-dialog>

    <div class="toast" :class="{ show: showToast }">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import {
  Promotion,
  User,
  UserFilled,
  Stamp,
  Phone,
  Clock,
  ChatLineSquare,
  CircleCheck,
  CircleClose,
  MessageBox
} from '@element-plus/icons-vue'
import { getParkingApplyAuditList, auditParkingApply } from '@/api/parkingApply'

const userStore = useUserStore()

const tabs = [
  { label: '待审批', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已驳回', value: 2 }
]

const activeTab = ref(0)
const list = ref([])
const total = ref(0)
const pendingCount = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const loadingMore = ref(false)

const auditVisible = ref(false)
const auditLoading = ref(false)
const auditForm = reactive({
  id: null,
  visitorName: '',
  plateNumber: '',
  auditResult: 1,
  auditRemark: ''
})

const showToast = ref(false)
const toastMsg = ref('')
let toastTimer = null

const emptyText = computed(() => {
  if (activeTab.value === 0) return '暂无待审批申请'
  if (activeTab.value === 1) return '暂无已通过的申请'
  return '暂无已驳回的申请'
})

const statusText = (s) => (s === 1 ? '审批通过' : s === 2 ? '审批驳回' : '待审批')
const statusType = (s) => (s === 1 ? 'success' : s === 2 ? 'danger' : 'info')

const showMsg = (msg) => {
  toastMsg.value = msg
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { showToast.value = false }, 2200)
}

const formatTime = (t) => {
  if (!t) return '—'
  return String(t).replace('T', ' ').slice(0, 16)
}

const fetchList = async (append = false) => {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const res = await getParkingApplyAuditList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      applyStatus: activeTab.value
    })
    const records = res.data.records || []
    list.value = append ? [...list.value, ...records] : records
    total.value = res.data.total || 0
    if (activeTab.value === 0) {
      pendingCount.value = total.value
    }
  } catch (_) {
    if (!append) {
      list.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const switchTab = (v) => {
  if (activeTab.value === v) return
  activeTab.value = v
  pageNum.value = 1
  list.value = []
  fetchList()
}

const loadMore = () => {
  pageNum.value += 1
  fetchList(true)
}

const openAudit = (row, result) => {
  auditForm.id = row.id
  auditForm.visitorName = row.visitorName
  auditForm.plateNumber = row.plateNumber
  auditForm.auditResult = result
  auditForm.auditRemark = ''
  auditVisible.value = true
}

const confirmAudit = async () => {
  if (auditForm.auditResult === 2 && !auditForm.auditRemark.trim()) {
    showMsg('驳回必须填写审批意见')
    return
  }
  auditLoading.value = true
  try {
    await auditParkingApply({
      id: auditForm.id,
      auditResult: auditForm.auditResult,
      auditRemark: auditForm.auditRemark.trim() || undefined
    })
    showMsg(auditForm.auditResult === 1 ? '已通过该申请' : '已驳回该申请')
    auditVisible.value = false
    pageNum.value = 1
    list.value = []
    fetchList()
  } catch (err) {
    showMsg(err?.message || '审批失败，请稍后重试')
  } finally {
    auditLoading.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.audit-mobile {
  min-height: 100vh;
  background: linear-gradient(180deg, #0d9488 0%, #0f766e 40%, #f5f7fa 40%, #f5f7fa 100%);
  padding-bottom: 40px;
  position: relative;
}

.au-header {
  padding: 16px 20px 24px;
  color: #fff;
}

.au-header__top {
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

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
}

.au-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  padding: 12px 0 6px;
}

.au-header__desc {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.85;
}

.au-main {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tab-bar {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 38px;
  border-radius: 9px;
  font-size: 14px;
  color: #475467;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: #fff;
    font-weight: 600;
  }
}

.tab-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.apply-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.empty-box {
  background: #fff;
  border-radius: 12px;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #c9cdd4;

  p {
    margin: 0;
    font-size: 13px;
    color: #98a2b3;
  }
}

.apply-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #eef0f3;

  .visitor {
    font-size: 16px;
    font-weight: 600;
    color: #1d2939;
  }

  .flex-sp {
    flex: 1;
  }
}

.card-rows {
  padding: 10px 0 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #475467;
  line-height: 1.5;

  .el-icon {
    margin-top: 2px;
    color: #14b8a6;
    flex-shrink: 0;
  }

  .remark {
    color: #86909c;
  }
}

.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: #98a2b3;

  .apply-no {
    font-family: 'SF Mono', Menlo, monospace;
  }

  .ctime {
    font-family: 'SF Mono', Menlo, monospace;
  }
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
}

.btn-reject,
.btn-pass {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pass {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #fff;

  &:hover { box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35); }
}

.btn-reject {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;

  &:hover { background: #fee2e2; }
}

.card-audited {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f2f3f5;
  font-size: 12px;
  color: #98a2b3;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .audit-remark {
    color: #86909c;
  }
}

.load-more {
  display: flex;
  justify-content: center;
}

.btn-more {
  padding: 10px 32px;
  border: 1px solid #99f6e4;
  background: #fff;
  color: #0d9488;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.list-end {
  text-align: center;
  font-size: 11px;
  color: #c9cdd4;
  margin: 0;
}

.au-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 11px;
  color: #98a2b3;
  opacity: 0.8;
}

.audit-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
  }
}

.audit-target {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f0fdfa;
  border-radius: 8px;

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: #134e4a;
  }
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
  max-width: 80vw;
  text-align: center;

  &.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
