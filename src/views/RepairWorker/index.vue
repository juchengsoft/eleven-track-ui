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
          <span>{{ userStore.userInfo?.nickName || '维修师傅' }}</span>
        </div>
      </div>
      <div class="au-header__title">
        <el-icon :size="20"><Tools /></el-icon>
        <span>维修工单</span>
      </div>
      <p class="au-header__desc">处理派给我的报修工单，完工后上传照片提交验收</p>
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
          <span v-if="t.value === 4 && pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
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

          <div class="card-actions" v-if="activeTab === 4">
            <button class="btn-delay" @click="openDelay(row)">
              <el-icon :size="14"><Clock /></el-icon>
              <span>延期说明</span>
            </button>
            <button class="btn-pass" @click="openComplete(row)">
              <el-icon :size="14"><CircleCheck /></el-icon>
              <span>完工递交</span>
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
      <span>荷韵小区巡点通 · 维修工单</span>
    </footer>

    <el-dialog
      v-model="delayVisible"
      title="延期说明"
      width="86%"
      :close-on-click-modal="false"
      class="audit-dialog"
    >
      <div class="dialog-target">
        <span class="dialog-target__name">{{ delayRow?.contactName }}</span>
        <span class="dialog-target__no">{{ delayRow?.orderNo }}</span>
      </div>
      <div class="dialog-label">延期原因</div>
      <el-select v-model="delayForm.delayReason" placeholder="请选择延期原因" style="width:100%">
        <el-option v-for="r in delayReasons" :key="r" :label="r" :value="r" />
      </el-select>
      <div class="dialog-label" style="margin-top:12px">补充说明（选填）</div>
      <el-input
        v-model="delayForm.remark"
        type="textarea"
        :rows="3"
        maxlength="200"
        show-word-limit
        placeholder="可补充说明当前维修进展或预计完工时间"
      />
      <template #footer>
        <el-button @click="delayVisible = false">取消</el-button>
        <el-button type="warning" :loading="delayLoading" @click="confirmDelay">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="completeVisible"
      title="维修完工递交"
      width="86%"
      :close-on-click-modal="false"
      class="audit-dialog"
    >
      <div class="dialog-target">
        <span class="dialog-target__name">{{ completeRow?.contactName }}</span>
        <span class="dialog-target__no">{{ completeRow?.orderNo }}</span>
      </div>
      <div class="dialog-label">完工照片（必填，最多6张）</div>
      <div class="upload-grid">
        <div class="upload-tile" v-for="(url, i) in completeImages" :key="i">
          <img :src="url" class="upload-tile__img" @click="handlePreview(url)" />
          <span class="upload-tile__remove" @click="removeCompleteImage(i)">
            <el-icon :size="12"><Close /></el-icon>
          </span>
        </div>
        <el-upload
          v-if="completeImages.length < 6"
          :show-file-list="false"
          :http-request="handleCompleteUpload"
          :before-upload="beforeUpload"
          accept="image/*"
          class="upload-add"
        >
          <div class="upload-add__inner" v-loading="uploading">
            <el-icon :size="24"><Camera /></el-icon>
            <span class="upload-add__text">添加图片</span>
          </div>
        </el-upload>
      </div>
      <div class="dialog-label" style="margin-top:12px">维修说明（选填）</div>
      <el-input
        v-model="completeForm.remark"
        type="textarea"
        :rows="3"
        maxlength="200"
        show-word-limit
        placeholder="可填写维修处理情况、更换材料等"
      />
      <template #footer>
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button type="primary" :loading="completeLoading" @click="confirmComplete">确认完工</el-button>
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

    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewList"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />

    <div class="toast" :class="{ show: showToast }">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import {
  Promotion,
  User,
  Tools,
  Phone,
  ChatLineSquare,
  Picture,
  Clock,
  Camera,
  Close,
  Document,
  CircleCheck,
  MessageBox
} from '@element-plus/icons-vue'
import {
  getRepairWorkerList,
  delayRepair,
  completeRepair,
  getRepairDetail,
  uploadRepairImage
} from '@/api/repair'
import { compressImage } from '@/utils/imageCompress'
import {
  getRepairStatusText,
  getRepairStatusTagType,
  getOperateTypeText,
  formatRepairTime
} from '@/views/Repair/status'

const userStore = useUserStore()

const tabs = [
  { label: '未完成', value: 4 },
  { label: '已完成', value: 6 }
]

const activeTab = ref(4)
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

const delayReasons = [
  '等待配件到货',
  '故障复杂需进一步排查',
  '需协调其他工种配合',
  '业主不在家无法入户',
  '天气原因无法施工',
  '其他原因'
]

const emptyText = computed(() => activeTab.value === 4 ? '暂无未完成工单' : '暂无已完成工单')

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
    const res = await getRepairWorkerList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderStatus: activeTab.value
    })
    const records = (res.data.records || []).map(r => ({ ...r, images: parseImages(r) }))
    list.value = append ? [...list.value, ...records] : records
    total.value = res.data.total || 0
    if (activeTab.value === 4) pendingCount.value = total.value
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

const delayVisible = ref(false)
const delayLoading = ref(false)
const delayRow = ref(null)
const delayForm = reactive({
  delayReason: '',
  remark: ''
})

const openDelay = (row) => {
  delayRow.value = row
  delayForm.delayReason = ''
  delayForm.remark = ''
  delayVisible.value = true
}

const confirmDelay = async () => {
  if (!delayForm.delayReason) {
    showMsg('请选择延期原因')
    return
  }
  delayLoading.value = true
  try {
    await delayRepair({
      id: delayRow.value.id,
      delayReason: delayForm.delayReason,
      remark: delayForm.remark.trim() || undefined
    })
    showMsg('延期说明已提交')
    delayVisible.value = false
    pageNum.value = 1
    list.value = []
    fetchList()
  } catch (err) {
    showMsg(err?.message || '提交失败')
  } finally {
    delayLoading.value = false
  }
}

const completeVisible = ref(false)
const completeLoading = ref(false)
const completeRow = ref(null)
const completeImages = ref([])
const uploading = ref(false)
const completeForm = reactive({
  remark: ''
})

const beforeUpload = (file) => {
  if (!file.type.startsWith('image/')) { showMsg('只能上传图片文件'); return false }
  if (file.size / 1024 / 1024 >= 20) { showMsg('图片过大，请选择 20MB 以内的图片'); return false }
  return true
}

const handleCompleteUpload = async (option) => {
  uploading.value = true
  try {
    const compressed = await compressImage(option.file)
    const res = await uploadRepairImage(compressed)
    const url = res.data?.url || res.data
    if (url) completeImages.value.push(url)
  } catch (e) {
    showMsg(e?.message || '图片上传失败')
  } finally {
    uploading.value = false
  }
}

const removeCompleteImage = (i) => completeImages.value.splice(i, 1)

const previewVisible = ref(false)
const previewList = ref([])
const previewIndex = ref(0)
const handlePreview = (url) => {
  previewList.value = completeImages.value.slice()
  previewIndex.value = completeImages.value.indexOf(url)
  previewVisible.value = true
}

const openComplete = (row) => {
  completeRow.value = row
  completeImages.value = []
  completeForm.remark = ''
  completeVisible.value = true
}

const confirmComplete = async () => {
  if (!completeImages.value.length) {
    showMsg('请至少上传一张完工照片')
    return
  }
  completeLoading.value = true
  try {
    await completeRepair({
      id: completeRow.value.id,
      imageUrls: completeImages.value.join(','),
      remark: completeForm.remark.trim() || undefined
    })
    showMsg('已提交完工，等待验收')
    completeVisible.value = false
    pageNum.value = 1
    list.value = []
    fetchList()
  } catch (err) {
    showMsg(err?.message || '提交失败')
  } finally {
    completeLoading.value = false
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

.au-header { padding: 16px 20px 24px; color: #fff; }
.au-header__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.brand { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 600; }
.user-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 4px 10px; border-radius: 20px; background: rgba(255, 255, 255, 0.15); }
.au-header__title { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700; padding: 12px 0 6px; }
.au-header__desc { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }

.au-main { max-width: 480px; margin: 0 auto; padding: 0 16px 16px; display: flex; flex-direction: column; gap: 14px; }

.tab-bar { display: flex; background: #fff; border-radius: 12px; padding: 4px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); }
.tab-item { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; height: 38px; border-radius: 9px; font-size: 14px; color: #475467; cursor: pointer; transition: all 0.2s;
  &.active { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #fff; font-weight: 600; }
}
.tab-badge { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }

.apply-list { display: flex; flex-direction: column; gap: 12px; min-height: 120px; }
.empty-box { background: #fff; border-radius: 12px; padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 10px; color: #c9cdd4;
  p { margin: 0; font-size: 13px; color: #98a2b3; }
}

.apply-card { background: #fff; border-radius: 12px; padding: 14px 16px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); }
.card-top { display: flex; align-items: center; gap: 8px; padding-bottom: 10px; border-bottom: 1px dashed #eef0f3;
  .contact { font-size: 16px; font-weight: 600; color: #1d2939; }
  .flex-sp { flex: 1; }
}
.card-rows { padding: 10px 0 4px; display: flex; flex-direction: column; gap: 6px; }
.row { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: #475467; line-height: 1.5;
  .el-icon { margin-top: 2px; color: #14b8a6; flex-shrink: 0; }
  .remark { color: #475467; }
}
.card-images { display: flex; flex-wrap: wrap; gap: 6px; }
.card-img { width: 56px; height: 56px; border-radius: 6px; cursor: pointer; }
.card-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 11px; color: #98a2b3;
  .order-no, .ctime { font-family: 'SF Mono', Menlo, monospace; }
}

.card-actions { display: flex; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f2f3f5; }
.btn-pass, .btn-delay, .btn-detail { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; height: 40px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-pass { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #fff; &:hover { box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35); } }
.btn-delay { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; &:hover { background: #ffedd5; } }
.btn-detail { background: #f0fdfa; color: #0d9488; border: 1px solid #99f6e4; &:hover { background: #ccfbf1; } }

.load-more { display: flex; justify-content: center; }
.btn-more { padding: 10px 32px; border: 1px solid #99f6e4; background: #fff; color: #0d9488; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.list-end { text-align: center; font-size: 11px; color: #c9cdd4; margin: 0; }

.au-footer { margin-top: 24px; text-align: center; font-size: 11px; color: #98a2b3; opacity: 0.8; }

.audit-dialog { :deep(.el-dialog) { border-radius: 12px; overflow: hidden; } }
.dialog-target { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; padding: 10px 12px; background: #f0fdfa; border-radius: 8px;
  &__name { font-size: 14px; font-weight: 600; color: #134e4a; }
  &__no { font-size: 12px; color: #0d9488; font-family: 'SF Mono', Menlo, monospace; margin-left: auto; }
}
.dialog-label { font-size: 13px; color: #475467; margin-bottom: 6px; }

.upload-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.upload-tile { position: relative; width: 88px; height: 88px; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  &__img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; display: block; }
  &__remove { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0, 0, 0, 0.5); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
}
.upload-add { :deep(.el-upload) { display: block; }
  &__inner { width: 88px; height: 88px; border: 1px dashed #c9cdd4; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: #86909c; background: #fafbfc; cursor: pointer; transition: border-color 0.2s, color 0.2s;
    &:hover { border-color: #14b8a6; color: #14b8a6; }
  }
  &__text { font-size: 11px; }
}

.detail-content { font-size: 13px; color: #475467; padding: 0 4px 12px; line-height: 1.6; border-bottom: 1px dashed #eef0f3; margin-bottom: 12px; }
.detail-timeline { padding-left: 4px; }
.tl-title { font-size: 14px; font-weight: 600; color: #1d2939; }
.tl-user { font-size: 12px; color: #86909c; margin-top: 2px; }
.tl-remark { font-size: 13px; color: #475467; margin-top: 4px; padding: 6px 10px; background: #f7f8fa; border-radius: 6px; line-height: 1.5; }
.tl-images { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tl-img { width: 64px; height: 64px; border-radius: 6px; cursor: pointer; }

.toast { position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%) scale(0.9); background: rgba(0, 0, 0, 0.8); color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; opacity: 0; pointer-events: none; transition: all 0.3s; z-index: 9999; max-width: 80vw; text-align: center;
  &.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
</style>
