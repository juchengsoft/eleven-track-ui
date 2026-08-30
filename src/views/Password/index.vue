<template>
  <div class="password-page">
    <div class="page-header">
      <div class="page-header__title">
        <el-icon class="page-header__icon" :size="22"><Lock /></el-icon>
        <span>修改密码</span>
      </div>
      <div class="page-header__subtitle">为了账号安全，建议定期更换密码</div>
    </div>

    <el-row :gutter="16" class="password-row">
      <el-col :span="8" class="password-col-left">
        <el-card shadow="never" class="user-card">
          <div class="user-card__avatar">
            <el-avatar :size="80" class="user-card__avatar-img">
              {{ (userInfo.nickName || userInfo.username || '?').slice(0, 1) }}
            </el-avatar>
            <h3 class="user-card__name">{{ userInfo.nickName || userInfo.username }}</h3>
            <el-tag
              :type="userInfo.role === 1 ? 'danger' : 'primary'"
              effect="light"
              size="small"
              round
            >
              {{ userInfo.role === 1 ? '超级管理员' : '巡检员' }}
            </el-tag>
          </div>
          <el-divider />
          <el-descriptions :column="1" size="small" class="user-card__info">
            <el-descriptions-item label="登录账号">
              <span class="col-username">{{ userInfo.username || '—' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="手机号">
              {{ userInfo.phone || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录">
              {{ formatTime(userInfo.lastLoginTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatTime(userInfo.createTime) }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="security-score">
            <div class="security-score__label">
              <span>账号安全</span>
              <span class="security-score__value">{{ securityScore }} 分</span>
            </div>
            <el-progress
              :percentage="securityScore"
              :color="securityColor"
              :stroke-width="6"
              :show-text="false"
              :indeterminate="false"
            />
            <span :class="['security-score__level', `is-${securityLevel}`]">
              {{ securityLevelText }}
            </span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16" class="password-col-right">
        <el-card shadow="never" class="password-card">
          <template #header>
            <div class="password-card__header">
              <el-icon :size="16"><Key /></el-icon>
              <span>密码修改</span>
            </div>
          </template>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
            class="password-form"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="form.oldPassword"
                type="password"
                show-password
                placeholder="请输入当前密码"
              />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="form.newPassword"
                type="password"
                show-password
                placeholder="至少 6 位，建议包含字母和数字"
              />
              <div class="password-strength" v-if="form.newPassword">
                <span class="password-strength__label">强度</span>
                <el-progress
                  :percentage="strengthPercent"
                  :color="strengthColor"
                  :stroke-width="6"
                  :show-text="false"
                  class="password-strength__bar"
                />
                <span :class="['password-strength__text', `is-${strengthLevel}`]">
                  {{ strengthText }}
                </span>
              </div>
              <div class="password-checklist" v-if="form.newPassword">
                <div :class="['check-item', { passed: checks.length }]">
                  <el-icon :size="12"><component :is="checks.length ? CircleCheck : CircleClose" /></el-icon>
                  <span>至少 6 位字符</span>
                </div>
                <div :class="['check-item', { passed: checks.hasLetter }]">
                  <el-icon :size="12"><component :is="checks.hasLetter ? CircleCheck : CircleClose" /></el-icon>
                  <span>包含字母</span>
                </div>
                <div :class="['check-item', { passed: checks.hasNumber }]">
                  <el-icon :size="12"><component :is="checks.hasNumber ? CircleCheck : CircleClose" /></el-icon>
                  <span>包含数字</span>
                </div>
                <div :class="['check-item', { passed: checks.hasSpecial }]">
                  <el-icon :size="12"><component :is="checks.hasSpecial ? CircleCheck : CircleClose" /></el-icon>
                  <span>包含特殊符号</span>
                </div>
              </div>
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :icon="Check" :loading="submitting" @click="handleSubmit">
                提交修改
              </el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="tips-card">
          <template #header>
            <div class="tips-card__header">
              <el-icon :size="16" color="#e6a23c"><Warning /></el-icon>
              <span>安全提示</span>
            </div>
          </template>
          <ul class="tips-list">
            <li>建议 90 天更换一次密码</li>
            <li>不要在多个平台使用相同密码</li>
            <li>修改成功后需要重新登录</li>
            <li>如发现账号异常请立即联系管理员</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { changePassword, getProfile } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Lock, Key, Check, Warning, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const submitting = ref(false)

const userInfo = reactive({
  username: '',
  nickName: '',
  phone: '',
  role: 2,
  lastLoginTime: '',
  createTime: ''
})

const lastPasswordChange = '从未修改'

const securityScore = computed(() => {
  let score = 60
  if (userInfo.phone) score += 15
  if (userInfo.role === 1) score += 10
  score = Math.min(score, 100)
  return score
})

const securityColor = computed(() => {
  if (securityScore.value >= 90) return '#67c23a'
  if (securityScore.value >= 60) return '#e6a23c'
  return '#f56c6c'
})

const securityLevel = computed(() => {
  if (securityScore.value >= 90) return 'high'
  if (securityScore.value >= 60) return 'medium'
  return 'low'
})

const securityLevelText = computed(() => {
  if (securityLevel.value === 'high') return '安全等级：高'
  if (securityLevel.value === 'medium') return '安全等级：中'
  return '安全等级：低'
})

const formatTime = (val) => {
  if (!val) return '从未登录'
  return val.replace('T', ' ').substring(0, 19)
}

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (_rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度 6-20 位', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value && value === form.oldPassword) {
          callback(new Error('新密码不能与当前密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

const checks = computed(() => {
  const pwd = form.newPassword
  return {
    length: pwd.length >= 6,
    hasLetter: /[a-zA-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[^a-zA-Z0-9]/.test(pwd)
  }
})

const passedCount = computed(() => {
  const c = checks.value
  let n = 0
  if (c.length) n++
  if (c.hasLetter) n++
  if (c.hasNumber) n++
  if (c.hasSpecial) n++
  return n
})

const strengthLevel = computed(() => {
  const pwd = form.newPassword
  if (!pwd) return 'none'
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (checks.value.hasLetter) score++
  if (checks.value.hasNumber) score++
  if (checks.value.hasSpecial) score++
  if (score <= 1) return 'weak'
  if (score <= 3) return 'medium'
  return 'strong'
})

const strengthPercent = computed(() => {
  if (strengthLevel.value === 'weak') return 33
  if (strengthLevel.value === 'medium') return 66
  if (strengthLevel.value === 'strong') return 100
  return 0
})

const strengthColor = computed(() => {
  if (strengthLevel.value === 'weak') return '#f56c6c'
  if (strengthLevel.value === 'medium') return '#e6a23c'
  if (strengthLevel.value === 'strong') return '#67c23a'
  return '#e4e7ed'
})

const strengthText = computed(() => {
  if (strengthLevel.value === 'weak') return '弱'
  if (strengthLevel.value === 'medium') return '中'
  if (strengthLevel.value === 'strong') return '强'
  return ''
})

const loadUserInfo = async () => {
  try {
    const res = await getProfile()
    const data = res.data || res
    Object.assign(userInfo, {
      username: data.username || '',
      nickName: data.nickName || '',
      phone: data.phone || '',
      role: data.role || 2,
      lastLoginTime: data.lastLoginTime || '',
      createTime: data.createTime || ''
    })
  } catch (_) {
    const info = userStore.userInfo || {}
    Object.assign(userInfo, {
      username: info.username || '',
      nickName: info.nickName || '',
      phone: info.phone || '',
      role: info.role || 2,
      lastLoginTime: info.lastLoginTime || '',
      createTime: info.createTime || ''
    })
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      })
      ElMessageBox.alert('密码修改成功，请使用新密码重新登录', '提示', {
        confirmButtonText: '重新登录',
        callback: () => {
          router.push('/login')
        }
      })
    } catch (_) {
      ElMessage.error('密码修改失败，请检查当前密码是否正确')
    } finally {
      submitting.value = false
    }
  })
}

const handleReset = () => {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  formRef.value?.clearValidate()
}

onMounted(loadUserInfo)
</script>

<style scoped lang="scss">
.password-page {
  .password-row {
    align-items: stretch;
  }

  .password-col-left {
    display: flex;
  }

  .password-col-right {
    display: flex;
    flex-direction: column;
  }

  .page-header {
    margin-bottom: 16px;

    &__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      color: #1d2129;
    }

    &__icon {
      color: #e6a23c;
      background: rgba(230, 162, 60, 0.1);
      padding: 6px;
      border-radius: 8px;
    }

    &__subtitle {
      font-size: 13px;
      color: #86909c;
      margin-top: 4px;
    }
  }
}

.user-card {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 10px 0 4px;

    &-img {
      background: linear-gradient(135deg, #e6a23c 0%, #c77c15 100%);
      color: #fff;
      font-weight: 600;
      border: 3px solid #fff;
      box-shadow: 0 2px 12px rgba(230, 162, 60, 0.25);
    }

    h3 {
      font-size: 16px;
      color: #1d2129;
      margin: 0;
    }
  }

  &__info {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0;

    :deep(.el-descriptions__label) {
      color: #86909c;
      width: 80px;
    }

    :deep(.el-descriptions__content) {
      color: #1d2129;
    }
  }
}

.security-score {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #eef0f3;

  &__label {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #4e5969;
    margin-bottom: 6px;
  }

  &__value {
    color: #409eff;
    font-weight: 600;
  }

  &__level {
    font-size: 12px;
    margin-top: 6px;

    &.is-high { color: #67c23a; }
    &.is-medium { color: #e6a23c; }
    &.is-low { color: #f56c6c; }
  }
}

.tips-card {
  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
}

.tips-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #4e5969;
  line-height: 1.8;

  li {
    margin-bottom: 2px;
  }
}

.password-card {
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;

  &__label {
    font-size: 12px;
    color: #86909c;
    flex-shrink: 0;
  }

  &__bar {
    flex: 1;
    max-width: 140px;
  }

  &__text {
    font-size: 12px;
    font-weight: 500;

    &.is-weak { color: #f56c6c; }
    &.is-medium { color: #e6a23c; }
    &.is-strong { color: #67c23a; }
  }
}

.password-checklist {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
  margin-top: 8px;
  padding: 10px 12px;
  background: #f7f8fa;
  border-radius: 8px;

  .check-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #86909c;

    .el-icon {
      color: #c9cdd4;
      transition: color 0.2s;
    }

    &.passed {
      color: #1d2129;

      .el-icon {
        color: #67c23a;
      }
    }
  }
}

.col-username {
  color: #409eff;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px;
}
</style>
