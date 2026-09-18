<template>
  <div class="apply-public">
    <header class="ap-header">
      <div class="ap-header__top">
        <div class="brand">
          <el-icon :size="24"><Promotion /></el-icon>
          <span>荷韵小区巡点通</span>
        </div>
      </div>
      <div class="ap-header__title">
        <el-icon :size="20"><Tools /></el-icon>
        <span>物业报修</span>
      </div>
      <p class="ap-header__desc">业主在线提交报修单，凭手机号随时查询维修进展</p>
    </header>

    <main class="ap-main">
      <section class="tab-bar">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'submit' }"
          @click="activeTab = 'submit'"
        >
          <el-icon :size="16"><EditPen /></el-icon>
          <span>我要报修</span>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'query' }"
          @click="activeTab = 'query'"
        >
          <el-icon :size="16"><Search /></el-icon>
          <span>查询进度</span>
        </div>
      </section>

      <template v-if="activeTab === 'submit'">
        <section class="success-panel" v-if="submitted">
          <div class="success-panel__ring">
            <el-icon :size="52"><Finished /></el-icon>
          </div>
          <h2 class="success-panel__title">报修单已提交</h2>
          <p class="success-panel__sub">请保持手机畅通，物业将尽快派单维修</p>
          <div class="success-panel__no" v-if="orderNo">
            <span class="label">报修单号</span>
            <span class="value">{{ orderNo }}</span>
          </div>
          <div class="success-panel__actions">
            <button class="btn-again" @click="resetForm">
              <el-icon :size="16"><EditPen /></el-icon>
              <span>再报一单</span>
            </button>
            <button class="btn-query" @click="goQuery">
              <el-icon :size="16"><Search /></el-icon>
              <span>查询我的报修</span>
            </button>
          </div>
        </section>

        <template v-else>
          <section class="form-section">
            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-position="top"
              class="apply-form"
            >
              <div class="form-section-title">
                <el-icon :size="16"><User /></el-icon>
                <span>联系信息</span>
              </div>
              <el-form-item label="联系人姓名" prop="contactName">
                <el-input v-model="form.contactName" placeholder="请输入您的姓名" maxlength="30">
                  <template #prefix><el-icon><User /></el-icon></template>
                </el-input>
              </el-form-item>
              <el-form-item label="联系电话" prop="contactPhone">
                <el-input
                  v-model="form.contactPhone"
                  placeholder="请输入11位手机号"
                  maxlength="11"
                  inputmode="numeric"
                >
                  <template #prefix><el-icon><Phone /></el-icon></template>
                </el-input>
              </el-form-item>

              <div class="form-section-title">
                <el-icon :size="16"><ChatLineSquare /></el-icon>
                <span>报修内容</span>
              </div>
              <el-form-item label="报修内容描述" prop="repairContent">
                <el-input
                  v-model="form.repairContent"
                  type="textarea"
                  :rows="4"
                  maxlength="500"
                  show-word-limit
                  placeholder="请描述故障位置、现象等，便于师傅快速处理"
                />
              </el-form-item>
              <el-form-item label="现场照片（选填，最多6张）">
                <div class="upload-grid">
                  <div class="upload-tile" v-for="(url, i) in uploadedImages" :key="i">
                    <img :src="url" class="upload-tile__img" @click="handlePreview(url)" />
                    <span class="upload-tile__remove" @click="removeImage(i)">
                      <el-icon :size="12"><Close /></el-icon>
                    </span>
                  </div>
                  <el-upload
                    v-if="uploadedImages.length < 6"
                    :show-file-list="false"
                    :http-request="handleUpload"
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
                <div class="upload-tip">支持 jpg/png/webp，上传时自动压缩，原图不超过 20MB</div>
              </el-form-item>
            </el-form>
          </section>

          <section class="submit-section">
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
                <span>提交报修单</span>
              </template>
            </button>
            <p class="submit-hint">提交后生成报修单号，可凭手机号查询进度</p>
          </section>
        </template>
      </template>

      <template v-else>
        <section class="form-section">
          <div class="form-section-title">
            <el-icon :size="16"><Phone /></el-icon>
            <span>按手机号查询</span>
          </div>
          <div class="query-row">
            <el-input
              v-model="queryPhone"
              placeholder="请输入报修时填写的手机号"
              maxlength="11"
              inputmode="numeric"
              clearable
              @keyup.enter="handleQuery"
            >
              <template #prefix><el-icon><Phone /></el-icon></template>
            </el-input>
            <button class="btn-query-primary" :disabled="queryLoading" @click="handleQuery">
              <span v-if="queryLoading">查询中...</span>
              <span v-else>查询</span>
            </button>
          </div>
        </section>

        <div class="query-list" v-loading="queryLoading">
          <div class="empty-box" v-if="!queryLoading && queried && resultList.length === 0">
            <el-icon :size="40"><MessageBox /></el-icon>
            <p>未查询到该手机号的报修记录</p>
          </div>

          <div class="order-card" v-for="row in resultList" :key="row.id" @click="openTimeline(row)">
            <div class="card-top">
              <span class="contact">{{ row.contactName }}</span>
              <el-tag size="small" effect="light" round :type="getRepairStatusTagType(row.orderStatus)">
                {{ getRepairStatusText(row.orderStatus) }}
              </el-tag>
            </div>
            <div class="card-rows">
              <div class="row">
                <el-icon :size="13"><ChatLineSquare /></el-icon>
                <span class="content-text">{{ row.repairContent }}</span>
              </div>
              <div class="row" v-if="row.images && row.images.length">
                <el-icon :size="13"><Picture /></el-icon>
                <div class="card-images" @click.stop>
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
              <div class="row" v-if="row.repairWorker">
                <el-icon :size="13"><UserFilled /></el-icon>
                <span>维修师傅：{{ row.repairWorker }}</span>
              </div>
            </div>
            <div class="card-foot">
              <span class="order-no">{{ row.orderNo }}</span>
              <span class="ctime">{{ formatRepairTime(row.updateTime || row.createTime) }}</span>
            </div>
          </div>
          <p class="list-end" v-if="!queryLoading && resultList.length">— 共 {{ resultList.length }} 条报修记录 —</p>
        </div>
      </template>
    </main>

    <footer class="ap-footer">
      <span>荷韵小区巡点通 · 物业报修</span>
    </footer>

    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewList"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />

    <el-dialog
      v-model="timelineVisible"
      title="报修进度"
      width="86%"
      :close-on-click-modal="true"
      class="timeline-dialog"
    >
      <div v-loading="timelineLoading">
        <div class="timeline-head" v-if="timelineOrder">
          <div class="timeline-head__no">{{ timelineOrder.orderNo }}</div>
          <el-tag size="small" effect="light" round :type="getRepairStatusTagType(timelineOrder.orderStatus)">
            {{ getRepairStatusText(timelineOrder.orderStatus) }}
          </el-tag>
        </div>
        <div class="timeline-content" v-if="timelineOrder?.content">{{ timelineOrder.content }}</div>
        <el-timeline v-if="timelineLogs.length" class="timeline-body">
          <el-timeline-item
            v-for="(log, idx) in timelineLogs"
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
import { ref, reactive } from 'vue'
import {
  Promotion,
  Tools,
  EditPen,
  Search,
  Finished,
  User,
  Phone,
  ChatLineSquare,
  Camera,
  CircleCheck,
  Close,
  UserFilled,
  MessageBox,
  Picture
} from '@element-plus/icons-vue'
import { submitRepairOrder, queryRepairByPhone, getRepairByOrderNo, uploadRepairImage } from '@/api/repair'
import { compressImage } from '@/utils/imageCompress'
import {
  getRepairStatusText,
  getRepairStatusTagType,
  getOperateTypeText,
  formatRepairTime
} from '@/views/Repair/status'

const activeTab = ref('submit')

const formRef = ref(null)
const submitting = ref(false)
const submitted = ref(false)
const orderNo = ref('')
const uploadedImages = ref([])
const uploading = ref(false)

const form = reactive({
  contactName: '',
  contactPhone: '',
  repairContent: ''
})

const rules = {
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  repairContent: [{ required: true, message: '请描述报修内容', trigger: 'blur' }]
}

const showToast = ref(false)
const toastMsg = ref('')
let toastTimer = null

const showMsg = (msg) => {
  toastMsg.value = msg
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { showToast.value = false }, 2200)
}

const beforeUpload = (file) => {
  if (!file.type.startsWith('image/')) {
    showMsg('只能上传图片文件')
    return false
  }
  if (file.size / 1024 / 1024 >= 20) {
    showMsg('图片过大，请选择 20MB 以内的图片')
    return false
  }
  return true
}

const handleUpload = async (option) => {
  uploading.value = true
  try {
    const compressed = await compressImage(option.file)
    const res = await uploadRepairImage(compressed)
    const url = res.data?.url || res.data
    if (url) uploadedImages.value.push(url)
  } catch (e) {
    showMsg(e?.message || '图片上传失败')
  } finally {
    uploading.value = false
  }
}

const removeImage = (i) => {
  uploadedImages.value.splice(i, 1)
}

const previewVisible = ref(false)
const previewList = ref([])
const previewIndex = ref(0)

const handlePreview = (url) => {
  previewList.value = uploadedImages.value.slice()
  previewIndex.value = uploadedImages.value.indexOf(url)
  previewVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (_) {
    return
  }

  const payload = {
    contactName: form.contactName.trim(),
    contactPhone: form.contactPhone.trim(),
    repairContent: form.repairContent.trim(),
    imageUrls: uploadedImages.value.length ? uploadedImages.value.join(',') : undefined
  }

  submitting.value = true
  try {
    const res = await submitRepairOrder(payload)
    orderNo.value = res.data?.orderNo || res.data?.order_no || ''
    submitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    showMsg(err?.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.contactName = ''
  form.contactPhone = ''
  form.repairContent = ''
  uploadedImages.value = []
  orderNo.value = ''
  submitted.value = false
  formRef.value?.clearValidate()
}

const goQuery = () => {
  queryPhone.value = form.contactPhone || ''
  activeTab.value = 'query'
  if (queryPhone.value.length === 11) handleQuery()
}

const queryPhone = ref('')
const queryLoading = ref(false)
const queried = ref(false)
const resultList = ref([])

const handleQuery = async () => {
  const phone = queryPhone.value.trim()
  if (!phone) {
    showMsg('请输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    showMsg('手机号格式不正确')
    return
  }
  queryLoading.value = true
  queried.value = true
  try {
    const res = await queryRepairByPhone(phone)
    resultList.value = (res.data || []).map(r => ({ ...r, images: parseImages(r) }))
  } catch (_) {
    resultList.value = []
  } finally {
    queryLoading.value = false
  }
}

const parseImages = (row) => {
  const imgs = []
  if (row.imageUrls) imgs.push(...String(row.imageUrls).split(',').filter(Boolean))
  if (row.images && Array.isArray(row.images)) imgs.push(...row.images)
  return imgs
}

const timelineVisible = ref(false)
const timelineLoading = ref(false)
const timelineOrder = ref(null)
const timelineLogs = ref([])

const openTimeline = async (row) => {
  timelineVisible.value = true
  timelineLoading.value = true
  timelineOrder.value = row
  timelineLogs.value = []
  try {
    const res = await getRepairByOrderNo(row.orderNo)
    const data = res.data || {}
    timelineOrder.value = { ...row, ...data }
    timelineLogs.value = data.logs || data.logList || []
  } catch (_) {
  } finally {
    timelineLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.apply-public {
  min-height: 100vh;
  background: linear-gradient(180deg, #0d9488 0%, #0f766e 40%, #f5f7fa 40%, #f5f7fa 100%);
  padding-bottom: 40px;
  position: relative;
}

.ap-header {
  padding: 16px 20px 24px;
  color: #fff;
}

.ap-header__top {
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

.ap-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  padding: 12px 0 6px;
}

.ap-header__desc {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.85;
}

.ap-main {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  gap: 6px;
  height: 42px;
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

.success-panel {
  background: linear-gradient(180deg, #f0fdfa 0%, #ffffff 50%);
  border: 1px solid #99f6e4;
  border-radius: 18px;
  padding: 28px 24px 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(13, 148, 136, 0.12);
}

.success-panel__ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(13, 148, 136, 0.35);
  animation: ringIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes ringIn {
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.success-panel__title {
  font-size: 22px;
  font-weight: 700;
  color: #0f766e;
  margin: 0 0 6px;
}

.success-panel__sub {
  font-size: 14px;
  color: #475467;
  margin: 0 0 16px;
}

.success-panel__no {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f0fdfa;
  border: 1px dashed #5eead4;
  border-radius: 10px;
  margin-bottom: 20px;

  .label { font-size: 12px; color: #0f766e; }
  .value {
    font-size: 14px;
    font-weight: 600;
    color: #134e4a;
    font-family: 'SF Mono', Menlo, monospace;
    letter-spacing: 0.5px;
  }
}

.success-panel__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.btn-again,
.btn-query {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-again {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: #fff;
  &:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(13, 148, 136, 0.3); }
}

.btn-query {
  background: #fff;
  color: #0d9488;
  border: 1px solid #5eead4;
  &:hover { background: #f0fdfa; }
}

.form-section {
  background: #fff;
  border-radius: 14px;
  padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #344054;
  margin: 4px 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #eef0f3;

  &:not(:first-child) { margin-top: 18px; }
}

.apply-form {
  :deep(.el-form-item) { margin-bottom: 14px; }
  :deep(.el-form-item__label) {
    padding-bottom: 4px;
    font-size: 13px;
    color: #475467;
    line-height: 1.5;
  }
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) { border-radius: 10px; }
}

.upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.upload-tile {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
    display: block;
  }

  &__remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
}

.upload-add {
  :deep(.el-upload) { display: block; }

  &__inner {
    width: 88px;
    height: 88px;
    border: 1px dashed #c9cdd4;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: #86909c;
    background: #fafbfc;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;

    &:hover { border-color: #14b8a6; color: #14b8a6; }
  }

  &__text { font-size: 11px; }
}

.upload-tip {
  margin-top: 6px;
  font-size: 11px;
  color: #98a2b3;
}

.query-row {
  display: flex;
  gap: 10px;

  :deep(.el-input__wrapper) { border-radius: 10px; }
}

.btn-query-primary {
  flex-shrink: 0;
  padding: 0 22px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.query-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 60px;
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

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08); }
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px dashed #eef0f3;

  .contact { font-size: 15px; font-weight: 600; color: #1d2939; }
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
  .content-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
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

.list-end {
  text-align: center;
  font-size: 11px;
  color: #c9cdd4;
  margin: 0;
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
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &.loading { pointer-events: none; }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.submit-hint {
  text-align: center;
  font-size: 12px;
  color: #98a2b3;
  margin: 10px 0 0;
}

.ap-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 11px;
  color: #98a2b3;
  opacity: 0.8;
}

.timeline-dialog {
  :deep(.el-dialog) { border-radius: 12px; overflow: hidden; }
}

.timeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f0fdfa;
  border-radius: 8px;
  margin-bottom: 10px;

  &__no {
    font-family: 'SF Mono', Menlo, monospace;
    font-weight: 600;
    color: #134e4a;
    font-size: 13px;
  }
}

.timeline-content {
  font-size: 13px;
  color: #475467;
  padding: 0 4px 12px;
  line-height: 1.6;
  border-bottom: 1px dashed #eef0f3;
  margin-bottom: 12px;
}

.timeline-body { padding-left: 4px; }

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

@media screen and (min-width: 768px) {
  .ap-main { max-width: 560px; padding: 0 24px 16px; }
}
</style>
