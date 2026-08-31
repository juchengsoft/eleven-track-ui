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
        <el-icon :size="20"><Van /></el-icon>
        <span>访客临时停车申请</span>
      </div>
      <p class="ap-header__desc">访客请如实填写以下信息提交，请准确填写停车时段。</p>
    </header>

    <main class="ap-main">
      <section class="success-panel" v-if="submitted">
        <div class="success-panel__ring">
          <el-icon :size="52"><Finished /></el-icon>
        </div>
        <h2 class="success-panel__title">提交成功</h2>
        <p class="success-panel__sub">您的临时停车申请已登记</p>
        <div class="success-panel__no" v-if="applyNo">
          <span class="label">申请编号</span>
          <span class="value">{{ applyNo }}</span>
        </div>
        <div class="success-panel__actions">
          <button class="btn-again" @click="resetForm">
            <el-icon :size="16"><EditPen /></el-icon>
            <span>再填一份</span>
          </button>
          <p class="success-panel__hint">可关闭本页面，祝您停车顺利</p>
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
              <span>访客信息</span>
            </div>
            <el-form-item label="访客姓名" prop="visitorName">
              <el-input v-model="form.visitorName" placeholder="请输入访客姓名" maxlength="32">
                <template #prefix><el-icon><User /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="访客手机号" prop="visitorPhone">
              <el-input v-model="form.visitorPhone" placeholder="请输入11位手机号" maxlength="11" inputmode="numeric">
                <template #prefix><el-icon><Phone /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="车牌号" prop="plateNumber">
              <el-input v-model="form.plateNumber" placeholder="如：浙A12345" maxlength="20">
                <template #prefix><el-icon><Van /></el-icon></template>
              </el-input>
            </el-form-item>

            <div class="form-section-title">
              <el-icon :size="16"><HomeFilled /></el-icon>
              <span>被访业主</span>
            </div>
            <el-form-item label="被访业主姓名" prop="ownerName">
              <el-input v-model="form.ownerName" placeholder="请输入被访业主姓名" maxlength="32">
                <template #prefix><el-icon><UserFilled /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="房号" prop="houseNo">
              <el-input v-model="form.houseNo" placeholder="如：1-1-101" maxlength="32">
                <template #prefix><el-icon><House /></el-icon></template>
              </el-input>
            </el-form-item>

            <div class="form-section-title">
              <el-icon :size="16"><Clock /></el-icon>
              <span>停车时段</span>
            </div>
            <el-form-item label="停车起止时间" prop="parkingRange">
              <el-date-picker
                v-model="form.parkingRange"
                type="datetimerange"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width:100%"
                :shortcuts="rangeShortcuts"
              />
            </el-form-item>

            <el-form-item label="备注（选填）" prop="remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="3"
                maxlength="255"
                show-word-limit
                placeholder="可填写车辆颜色、来访事由等"
              />
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
              <span>提交申请</span>
            </template>
          </button>
          <p class="submit-hint">提交后将自动生成申请编号并登记留痕</p>
        </section>
      </template>
    </main>

    <footer class="ap-footer">
      <span>荷韵小区巡点通 · 访客临时停车登记</span>
    </footer>

    <div class="toast" :class="{ show: showToast }">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import {
  Promotion,
  Van,
  User,
  UserFilled,
  HomeFilled,
  House,
  Phone,
  Clock,
  EditPen,
  CircleCheck,
  Finished
} from '@element-plus/icons-vue'
import { submitParkingApply } from '@/api/parkingApply'

const formRef = ref(null)
const submitting = ref(false)
const submitted = ref(false)
const applyNo = ref('')

const showToast = ref(false)
const toastMsg = ref('')
let toastTimer = null

const form = reactive(getInitForm())

const rules = {
  visitorName: [{ required: true, message: '请输入访客姓名', trigger: 'blur' }],
  visitorPhone: [
    { required: true, message: '请输入访客手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  plateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  ownerName: [{ required: true, message: '请输入被访业主姓名', trigger: 'blur' }],
  houseNo: [{ required: true, message: '请输入房号', trigger: 'blur' }],
  parkingRange: [{ required: true, message: '请选择停车起止时间', trigger: 'change' }]
}

const rangeShortcuts = [
  { text: '2小时', value: () => rangeFromNow(0, 2) },
  { text: '半天', value: () => rangeFromNow(0, 12) },
  { text: '一天', value: () => rangeFromNow(0, 24) },
  { text: '三天', value: () => rangeFromNow(0, 24 * 3) }
]

function rangeFromNow (startOffsetH, durationH) {
  const start = new Date(new Date().getTime() + startOffsetH * 3600 * 1000)
  const end = new Date(start.getTime() + durationH * 3600 * 1000)
  return [start, end]
}

function getInitForm () {
  return {
    visitorName: '',
    visitorPhone: '',
    plateNumber: '',
    ownerName: '',
    houseNo: '',
    parkingRange: [],
    remark: ''
  }
}

const showMsg = (msg) => {
  toastMsg.value = msg
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { showToast.value = false }, 2200)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (_) {
    return
  }

  if (!form.parkingRange || form.parkingRange.length !== 2) {
    showMsg('请选择停车起止时间')
    return
  }

  const payload = {
    visitorName: form.visitorName.trim(),
    visitorPhone: form.visitorPhone.trim(),
    plateNumber: form.plateNumber.trim(),
    ownerName: form.ownerName.trim(),
    houseNo: form.houseNo.trim(),
    applyStart: form.parkingRange[0],
    applyEnd: form.parkingRange[1],
    remark: form.remark?.trim() || undefined
  }

  submitting.value = true
  try {
    const res = await submitParkingApply(payload)
    applyNo.value = res.data?.applyNo || res.data?.apply_no || ''
    submitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    showMsg(err?.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  Object.assign(form, getInitForm())
  applyNo.value = ''
  submitted.value = false
  formRef.value?.clearValidate()
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

  .label {
    font-size: 12px;
    color: #0f766e;
  }

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

.btn-again {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 28px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(13, 148, 136, 0.3);
  }
}

.success-panel__hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: #98a2b3;
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

  &:not(:first-child) {
    margin-top: 18px;
  }
}

.apply-form {
  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 4px;
    font-size: 13px;
    color: #475467;
    line-height: 1.5;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 10px;
  }
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
  to { transform: rotate(360deg); }
}

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

@media screen and (min-width: 768px) {
  .ap-main {
    max-width: 560px;
    padding: 0 24px 16px;
  }
}
</style>
