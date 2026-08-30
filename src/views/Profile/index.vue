<template>
  <div class="profile-page">
    <div class="page-header">
      <div class="page-header__title">
        <el-icon class="page-header__icon" :size="22"><User /></el-icon>
        <span>个人中心</span>
      </div>
      <div class="page-header__subtitle">查看并修改个人基本信息</div>
    </div>

    <el-row :gutter="16" class="profile-row">
      <el-col :span="8" class="profile-col-left">
        <el-card shadow="never" class="profile-card">
          <div class="profile-card__avatar">
            <el-avatar :size="80" class="profile-card__avatar-img">
              {{ (form.nickName || form.username || '?').slice(0, 1) }}
            </el-avatar>
            <h3 class="profile-card__name">{{ form.nickName || form.username }}</h3>
            <el-tag
              :type="form.role === 1 ? 'danger' : 'primary'"
              effect="light"
              size="small"
              round
            >
              {{ form.role === 1 ? '超级管理员' : '巡检员' }}
            </el-tag>
          </div>
          <el-divider />
          <el-descriptions :column="1" size="small" class="profile-card__info">
            <el-descriptions-item label="登录账号">
              <span class="col-username">{{ form.username }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="手机号">
              {{ form.phone || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录">
              {{ formatTime(form.lastLoginTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatTime(form.createTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="16" class="profile-col-right">
        <el-card shadow="never" class="edit-card">
          <div class="edit-card__title">
            <span>基本信息</span>
            <span class="edit-card__tip">账号信息不可修改，如需变更请联系管理员</span>
          </div>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
            class="edit-form"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="登录账号">
                  <el-input v-model="form.username" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="角色">
                  <el-input :value="form.role === 1 ? '超级管理员' : '巡检员'" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="姓名" prop="nickName">
                  <el-input v-model="form.nickName" placeholder="请输入姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="form.phone" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="个人简介">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="3"
                placeholder="简单介绍自己（选填）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Check" @click="handleSave">保存修改</el-button>
              <el-button @click="loadProfile">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getProfile, updateProfile } from '@/api/user'
import { ElMessage } from 'element-plus'
import { User, Check } from '@element-plus/icons-vue'

const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  nickName: '',
  phone: '',
  role: 2,
  remark: '',
  createTime: '',
  lastLoginTime: ''
})

const rules = {
  nickName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const formatTime = (val) => {
  if (!val) return '从未登录'
  return val.replace('T', ' ').substring(0, 19)
}

const loadProfile = async () => {
  loading.value = true
  try {
    const res = await getProfile()
    const data = res.data || res
    Object.assign(form, {
      username: data.username || '',
      nickName: data.nickName || '',
      phone: data.phone || '',
      role: data.role || 2,
      remark: data.remark || '',
      createTime: data.createTime || '',
      lastLoginTime: data.lastLoginTime || ''
    })
    userStore.setUserInfo(data)
  } catch (_) {
    const info = userStore.userInfo || {}
    Object.assign(form, {
      username: info.username || '',
      nickName: info.nickName || '',
      phone: info.phone || '',
      role: info.role || 2,
      remark: info.remark || '',
      createTime: info.createTime || '',
      lastLoginTime: info.lastLoginTime || ''
    })
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await updateProfile({
        nickName: form.nickName,
        phone: form.phone,
        remark: form.remark
      })
      const data = res.data || res
      if (data.nickName) {
        userStore.setUserInfo({ ...userStore.userInfo, nickName: data.nickName, phone: data.phone })
      }
      ElMessage.success('保存成功')
      loadProfile()
    } catch (_) {
      ElMessage.error('保存失败')
    }
  })
}

onMounted(loadProfile)
</script>

<style scoped lang="scss">
.profile-page {
  .profile-row {
    align-items: stretch;
  }

  .profile-col-left {
    display: flex;
  }

  .profile-col-right {
    display: flex;
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
      color: #409eff;
      background: rgba(64, 158, 255, 0.1);
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

.profile-card {
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
      background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
      color: #fff;
      font-weight: 600;
      border: 3px solid #fff;
      box-shadow: 0 2px 12px rgba(64, 158, 255, 0.25);
    }

    h3 {
      font-size: 16px;
      color: #1d2129;
      margin: 0;
    }
  }

  &__info {
    text-align: left;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;

    :deep(.el-descriptions__label) {
      color: #86909c;
      width: 80px;
    }

    :deep(.el-descriptions__content) {
      color: #1d2129;
    }
  }
}

.edit-card {
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 4px;

    &__tip {
      font-size: 12px;
      font-weight: 400;
      color: #c9cdd4;
    }
  }
}

.col-username {
  color: #409eff;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px;
}
</style>
