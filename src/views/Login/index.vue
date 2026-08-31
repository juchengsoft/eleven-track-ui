<template>
  <div class="login-container">
    <div class="login-left">
      <div class="left-content">
        <div class="system-logo">NFC巡点通</div>
        <h1 class="title">荷韵江南苑园区巡检保洁一体化管理系统</h1>
        <p class="desc">
          标准化点位打卡・巡检保洁留痕溯源・园区运维精细化管控
        </p>
        <div class="feature-list">
          <div class="item">
            <el-icon size="22"><Check /></el-icon>
            <span>NFC 实体点位近距离快捷打卡签到</span>
          </div>
          <div class="item">
            <el-icon size="22"><Check /></el-icon>
            <span>设备巡检数据自动存档，异常问题实时登记</span>
          </div>
          <div class="item">
            <el-icon size="22"><Check /></el-icon>
            <span>日常保洁作业打卡记录全程归档追溯</span>
          </div>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="login-card">
        <div class="card-head">
          <h2>账号登录</h2>
          <p>请输入您的账号密码进入管理后台</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-width="0"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="登录账号"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="登录密码"
              size="large"
              prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-submit"
              :loading="loading"
              @click="handleLogin"
            >
              立即登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="copyright">
          © 2026 NFC 巡点通管理系统 All Rights Reserved
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { loginApi } from '@/api/login'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const loginRules = ref({
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }]
})

const handleLogin = async () => {
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (loading.value) return
  loading.value = true

  try {
    const res = await loginApi(loginForm.value)
    const payload = res.data || {}
    const token = payload.token
    if (!token) {
      ElMessage.error(res.msg || '登录响应缺少 token')
      loading.value = false
      return
    }
    const user = {
      id: payload.userId ?? payload.id,
      role: payload.role,
      nickName: payload.nickName,
      username: payload.username,
      depId: payload.depId ?? null
    }
    userStore.setToken(token)
    userStore.setUserInfo(user)
    ElMessage.success('登录成功，正在跳转...')

    if (route.query.redirect) {
      const redirect = decodeURIComponent(String(route.query.redirect))
      if (redirect.startsWith('/')) {
        router.replace(redirect)
        return
      }
    }

    const defaultPath = user.role === 2 ? '/workspace' : '/dashboard'
    router.replace(defaultPath)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;

  .login-left {
    width: 55%;
    background: linear-gradient(135deg, #2b76d9 0%, #54a0ff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;

    .left-content {
      padding: 0 60px;

      .system-logo {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 2px;
        margin-bottom: 24px;
      }
      .title {
        font-size: 28px;
        margin: 0 0 12px;
        font-weight: 500;
      }
      .desc {
        font-size: 16px;
        opacity: 0.9;
        margin-bottom: 40px;
        line-height: 1.6;
      }
      .feature-list {
        .item {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          font-size: 16px;
          gap: 12px;
        }
      }
    }
  }

  .login-right {
    flex: 1;
    background-color: #f7f8fa;
    display: flex;
    align-items: center;
    justify-content: center;

    .login-card {
      width: 420px;
      background: #ffffff;
      border-radius: 16px;
      padding: 45px 40px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);

      .card-head {
        text-align: center;
        margin-bottom: 36px;

        h2 {
          font-size: 24px;
          color: #1d2129;
          margin: 0 0 6px;
        }
        p {
          color: #86909c;
          font-size: 14px;
          margin: 0;
        }
      }

      .login-form {
        .el-form-item {
          margin-bottom: 22px;
        }
        .el-input__inner {
          height: 46px;
        }
      }

      .login-submit {
        width: 100%;
        height: 48px;
        font-size: 16px;
        background: #2b76d9;
        border: none;
      }

      .copyright {
        text-align: center;
        margin-top: 36px;
        font-size: 13px;
        color: #c9cdd4;
      }
    }
  }
}

@media screen and (max-width: 992px) {
  .login-container {
    flex-direction: column;
    .login-left {
      width: 100%;
      height: 35vh;
      .left-content {
        padding: 0 30px;
      }
    }
    .login-right {
      flex: 1;
      padding: 20px 0;
    }
  }
}
</style>