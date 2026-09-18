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
        <el-icon :size="20"><Tools /></el-icon>
        <span>物业报修管理</span>
      </div>
      <p class="au-header__desc">派单给维修师傅，验收维修完工报修单</p>
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
          <span v-if="t.value === 3 && pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
        </div>
      </section>

      <div class="apply-list" v-loading="loading">
        <div class="empty-box" v-if="!loading && list.length === 0">
          <el-icon :size="40"><MessageBox /></el-icon>
          <p>{{ emptyText }}</p>
        </div>

        <div class="apply-card" v-for="row in list" :key="row.id">
          <div class="card-top">
            <span class="contact">{{ row.contactName }}</span>
            <span class="flex-sp"></span>
            <el-tag size="small" effect="light" round :type="getRepairStatusTagType(row.orderStatus)">
              {{ getRepairStatusText(row.orderStatus) }}
            </el-tag>
          </div>
          <div class="card-rows">
            <div class="row">
              <el-icon :size="13"><Phone /></el-icon>
              <span>{{ row.contactPhone }}</span>
            </div>
            <div class="row">
              <el-icon :size="13"><ChatLineSquare /></el-icon>
              <span class="remark">{{ row.repairContent }}</span>
            </div>
            <div class="row" v-if="row.repairWorker">
              <el-icon :size="13"><UserFilled /></el-icon>
              <span>维修师傅：{{ row.repairWorker }}</span>
            </div>
            <div class="row" v-if="row.images && row.images.length">
              <el-icon :size="13"><Picture /></el-icon>
              <div class="card-images">
                <el-image
                  v-for="(url, i) in row.images"
                  :key="i"
                  :src="url"
                  :preview-src-list="row.images"
                  :initial-index="i"
                  fit="cover"
                  class="card-img"
                  preview-teleported
                />
              </div>
            </div>
          </div>
          <div class="card-foot">
            <span class="order-no">{{ row.orderNo }}</span>
            <span class="ctime">{{ formatRepairTime(row.updateTime || row.createTime) }}</span>
          </div>

          <div class="card-actions" v-if="activeTab === 3">
            <button class="btn-pass" @click="openDispatch(row)">
              <el-icon :size="14"><SetUp /></el-icon>
              <span>派单</span>
            </button>
            <button class="btn-detail" @click="openDetail(row)">
              <el-icon :size="14"><Document /></el-icon>
              <span>详情</span>
            </button>
          </div>
          <div class="card-actions" v-else-if="activeTab === 5">
            <button class="btn-reject" @click="openAccept(row, 7)">
              <el-icon :size="14"><CircleClose /></el-icon>
              <span>驳回返工</span>
            </button>
            <button class="btn-pass" @click="openAccept(row, 6)">
              <el-icon :size="14"><CircleCheck /></el-icon>
              <span>验收通过</span>
            </button>
          </div>
          <div class="card-actions" v-else>
            <button class="btn-detail" @click="openDetail(row)">
              <el-icon :size="14"><Document /></el-icon>
              <span>查看进度</span>
            </button>
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
      <span>荷韵小区巡点通 · 物业报修管理</span>
    </footer>

    <!-- 派单弹窗 -->
    <el-dialog
      v-model="dispatchVisible"
      title="派单给维修师傅"
      width="86%"
      :close-on-click-modal="false"
      class="audit-dialog"
    >
      <div class="dialog-target">
        <span class="dialog-target__name">{{ dispatchRow?.contactName }}</span>
        <span class="dialog-target__no">{{ dispatchRow?.orderNo }}</span>
      </div>
      <div class="dialog-label">选择维修师傅（可多选）</div>
      <el-select
        v-model="dispatchForm.workerIds"
        multiple
        filterable
        placeholder="请选择维修师傅"
        style="width:100%"
        :loading="workersLoading"
      >
        <el-option
          v-for="w in workerOptions"
          :key="w.id"
          :label="w.nickName || w.username"
          :value="w.id"
        />
      </el-select>
      <div class="dialog-label" style="margin-top:12px">派单备注（选填）</div>
      <el-input
        v-model="dispatchForm.remark"
        type="textarea"
        :rows="3"
        maxlength="200"
        show-word-limit
        placeholder="可填写维修要求或注意事项"
      />
      <template #footer>
        <el-button @click="dispatchVisible = false">取消</el-button>
        <el-button type="primary" :loading="dispatchLoading" @click="confirmDispatch">确认派单</el-button>
      </template>
    </el-dialog>

    <!-- 验收弹窗 -->
    <el-dialog
      v-model="acceptVisible"
      :title="acceptForm.acceptResult === 6 ? '验收通过' : '验收驳回返工'"
      width="86%"
      :close-on-click-modal="false"
      class="audit-dialog"
    >
      <div class="dialog-target">
        <span class="dialog-target__name">{{ acceptRow?.contactName }}</span>
        <span class="dialog-target__no">{{ acceptRow?.orderNo }}</span>
      </div>
      <el-input
        v-model="acceptForm.remark"
        type="textarea"
        :rows="3"
        maxlength="200"
        show-word-limit
        :placeholder="acceptForm.acceptResult === 6 ? '验收意见（选填）' : '请填写返工原因'"
      />
      <template #footer>
        <el-button @click="acceptVisible = false">取消</el-button>
        <el-button
          :type="acceptForm.acceptResult === 6 ? 'success' : 'danger'"
          :loading="acceptLoading"
          @click="confirmAccept"
        >
          {{ acceptForm.acceptResult === 6 ? '确认通过' : '确认驳回返工' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="报修进度"
      width="86%"
      :close-on-click-modal="true"
      class="audit-dialog"
    >
      <div v-loading="detailLoading">
        <div class="dialog-target" v-if="detailRow">
          <span class="dialog-target__name">{{ detailRow.contactName }}</span>
          <el-tag size="small" effect="light" round :type="getRepairStatusTagType(detailRow.orderStatus)">
            {{ getRepairStatusText(detailRow.orderStatus) }}
          </el-tag>
          <span class="dialog-target__no">{{ detailRow.orderNo }}</span>
        </div>
        <div class="detail-content" v-if="detailRow?.repairContent">{{ detailRow.repairContent }}</div>
        <el-timeline v-if="detailLogs.length" class="detail-timeline">
          <el-timeline-item
            v-for="(log, idx) in detailLogs"
            :key="idx"
            :timestamp="formatRepairTime(log.createTime)"
            placement="top"
            :type="log.operateStatus === 6 ? 'success' : log.operateStatus === 7 || log.operateStatus === 2 ? 'danger' : 'primary'"
          >
            <div class="tl-title">{{ getOperateTypeText(log.operateType) }}</div>
            <div class="tl-user" v-if="log.operateUser">操作人：{{ log.operateUser }}</div>
            <div class="tl-remark" v-if="log.operateRemark">{{ log.operateRemark }}</div>
            <div class="tl-images" v-if="log.imageUrls">
              <el-image
                v-for="(url, i) in log.imageUrls.split(',').filter(Boolean)"
                :key="i"
                :src="url"
                :preview-src-list="log.imageUrls.split(',').filter(Boolean)"
                :initial-index="i"
                fit="cover"
                class="tl-img"
                preview-teleported
              />
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无进度记录" />
      </div>
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
  Tools,
  Phone,
  ChatLineSquare,
  Picture,
  SetUp,
  Document,
  CircleCheck,
  CircleClose,
  MessageBox
} from '@element-plus/icons-vue'
import {
  getRepairAuditList,
  getRepairWorkers,
  dispatchRepair,
  acceptRepair,
  getRepairDetail
} from '@/api/repair'
import {
  getRepairStatusText,
  getRepairStatusTagType,
  getOperateTypeText,
  formatRepairTime
} from '@/views/Repair/status'

const userStore = useUserStore()

const tabs = [
  { label: '待派单', value: 3 },
  { label: '待验收', value: 5 },
  { label: '已完成', value: 6 }
]

const activeTab = ref(3)
const list = ref([])
const total = ref(0)
const pendingCount = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const loadingMore = ref(false)

const showToast = ref(false)
const toastMsg = ref('')
let toastTimer = null

const emptyText = computed(() => {
  if (activeTab.value === 3) return '暂无待派单报修'
  if (activeTab.value === 5) return '暂无待验收报修'
  return '暂无已完成报修'
})

const showMsg = (msg) => {
  toastMsg.value = msg
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { showToast.value = false }, 2200)
}

const parseImages = (row) => {
  const imgs = []
  if (row.imageUrls) imgs.push(...String(row.imageUrls).split(',').filter(Boolean))
  if (row.images && Array.isArray(row.images)) imgs.push(...row.images)
  return imgs
}

const fetchList = async (append = false) => {
  if (append) loadingMore.value = true
  else loading.value = true
  try {
    const res = await getRepairAuditList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderStatus: activeTab.value
    })
    const records = (res.data.records || []).map(r => ({ ...r, images: parseImages(r) }))
    list.value = append ? [...list.value, ...records] : records
    total.value = res.data.total || 0
    if (activeTab.value === 3) pendingCount.value = total.value
  } catch (_) {
    if (!append) { list.value = []; total.value = 0 }
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

const dispatchVisible = ref(false)
const dispatchLoading = ref(false)
const dispatchRow = ref(null)
const workerOptions = ref([])
const workersLoading = ref(false)
const dispatchForm = reactive({
  workerIds: [],
  remark: ''
})

const openDispatch = async (row) => {
  dispatchRow.value = row
  dispatchForm.workerIds = []
  dispatchForm.remark = ''
  dispatchVisible.value = true
  if (workerOptions.value.length === 0) {
    workersLoading.value = true
    try {
      const res = await getRepairWorkers()
      workerOptions.value = res.data || []
    } catch (_) {
      workerOptions.value = []
    } finally {
      workersLoading.value = false
    }
  }
}

const confirmDispatch = async () => {
  if (!dispatchForm.workerIds.length) {
    showMsg('请至少选择一位维修师傅')
    return
  }
  const workers = workerOptions.value
    .filter(w => dispatchForm.workerIds.includes(w.id))
    .map(w => w.nickName || w.username)
  dispatchLoading.value = true
  try {
    await dispatchRepair({
      id: dispatchRow.value.id,
      workerIds: dispatchForm.workerIds,
      workerNames: workers.join(','),
      remark: dispatchForm.remark.trim() || undefined
    })
    showMsg('派单成功')
    dispatchVisible.value = false
    pageNum.value = 1
    list.value = []
    fetchList()
  } catch (err) {
    showMsg(err?.message || '派单失败')
  } finally {
    dispatchLoading.value = false
  }
}

const acceptVisible = ref(false)
const acceptLoading = ref(false)
const acceptRow = ref(null)
const acceptForm = reactive({
  acceptResult: 6,
  remark: ''
})

const openAccept = (row, result) => {
  acceptRow.value = row
  acceptForm.acceptResult = result
  acceptForm.remark = ''
  acceptVisible.value = true
}

const confirmAccept = async () => {
  if (acceptForm.acceptResult === 7 && !acceptForm.remark.trim()) {
    showMsg('驳回返工必须填写原因')
    return
  }
  acceptLoading.value = true
  try {
    await acceptRepair({
      id: acceptRow.value.id,
      orderStatus: acceptForm.acceptResult,
      remark: acceptForm.remark.trim() || undefined
    })
    showMsg(acceptForm.acceptResult === 6 ? '已验收通过' : '已驳回返工')
    acceptVisible.value = false
    pageNum.value = 1
    list.value = []
    fetchList()
  } catch (err) {
    showMsg(err?.message || '验收失败')
  } finally {
    acceptLoading.value = false
  }
}

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailRow = ref(null)
const detailLogs = ref([])

const openDetail = async (row) => {
  detailVisible.value = true
  detailLoading.value = true
  detailRow.value = row
  detailLogs.value = []
  try {
    const res = await getRepairDetail(row.id)
    const data = res.data || {}
    detailRow.value = { ...row, ...data }
    detailLogs.value = data.logs || data.logList || []
  } catch (_) {
  } finally {
    detailLoading.value = false
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

  p { margin: 0; font-size: 13px; color: #98a2b3; }
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

  .contact { font-size: 16px; font-weight: 600; color: #1d2939; }
  .flex-sp { flex: 1; }
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

  .el-icon { margin-top: 2px; color: #14b8a6; flex-shrink: 0; }
  .remark { color: #475467; }
}

.card-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-img {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  cursor: pointer;
}

.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: #98a2b3;

  .order-no, .ctime { font-family: 'SF Mono', Menlo, monospace; }
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
}

.btn-pass,
.btn-reject,
.btn-detail {
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

.btn-detail {
  background: #f0fdfa;
  color: #0d9488;
  border: 1px solid #99f6e4;
  &:hover { background: #ccfbf1; }
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
  :deep(.el-dialog) { border-radius: 12px; overflow: hidden; }
}

.dialog-target {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f0fdfa;
  border-radius: 8px;

  &__name { font-size: 14px; font-weight: 600; color: #134e4a; }
  &__no { font-size: 12px; color: #0d9488; font-family: 'SF Mono', Menlo, monospace; margin-left: auto; }
}

.dialog-label {
  font-size: 13px;
  color: #475467;
  margin-bottom: 6px;
}

.detail-content {
  font-size: 13px;
  color: #475467;
  padding: 0 4px 12px;
  line-height: 1.6;
  border-bottom: 1px dashed #eef0f3;
  margin-bottom: 12px;
}

.detail-timeline { padding-left: 4px; }

.tl-title { font-size: 14px; font-weight: 600; color: #1d2939; }
.tl-user { font-size: 12px; color: #86909c; margin-top: 2px; }
.tl-remark {
  font-size: 13px;
  color: #475467;
  margin-top: 4px;
  padding: 6px 10px;
  background: #f7f8fa;
  border-radius: 6px;
  line-height: 1.5;
}

.tl-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tl-img {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  cursor: pointer;
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

  &.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
</style>
