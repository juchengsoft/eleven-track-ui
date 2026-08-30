<template>
  <div class="user-manage">
    <div class="page-header">
      <div class="page-header__title">
        <el-icon class="page-header__icon" :size="22"><UserFilled /></el-icon>
        <span>账号管理</span>
      </div>
      <div class="page-header__subtitle">管理系统用户账号，支持新增、角色分配、启停与删除操作</div>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-card__inner">
        <el-form :inline="true" :model="queryForm" class="filter-form">
          <el-form-item label="关键字">
            <el-input
              v-model="queryForm.keyword"
              placeholder="账号 / 姓名 / 手机号"
              clearable
              @keyup.enter="handleSearch"
              style="width:280px"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="queryForm.role" placeholder="全部" clearable style="width:140px">
              <el-option label="超级管理员" :value="1" />
              <el-option label="巡检员" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryForm.status" placeholder="全部" clearable style="width:120px">
              <el-option label="正常" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item class="filter-form__search-actions">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="table-card__header">
        <div class="table-card__header-left">
          <el-button type="primary" :icon="Plus" @click="openDialog()">新增账号</el-button>
        </div>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" circle @click="getList" />
        </el-tooltip>
      </div>

      <el-table :data="tableData" empty-text="暂无账号数据" v-loading="loading" class="user-table" stripe style="width:100%">
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="36" class="col-avatar">
              {{ (row.nickName || row.username || '?').slice(0, 1) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="登录账号" prop="username" min-width="120">
          <template #default="{ row }">
            <span class="col-username">{{ row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column label="姓名" prop="nickName" min-width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="col-name">{{ row.nickName || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="手机号" prop="phone" width="130" />
        <el-table-column label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="light"
              round
              :type="row.role === 1 ? 'danger' : 'primary'"
            >
              <el-icon :size="12" style="margin-right:2px">
                <component :is="row.role === 1 ? 'Finished' : 'User'" />
              </el-icon>
              {{ row.role === 1 ? '超级管理员' : '巡检员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="['status-dot', row.status === 1 ? 'status-dot--success' : 'status-dot--danger']"></span>
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light" size="small" round>
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="{ row }">
            <span class="col-time">{{ formatTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="160" align="center">
          <template #default="{ row }">
            <span class="col-time" :class="{ 'text-muted': !row.lastLoginTime }">
              {{ formatTime(row.lastLoginTime) || '从未登录' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="编辑账号" placement="top">
              <el-button link type="primary" :icon="Edit" @click="openDialog(row)" />
            </el-tooltip>
            <el-tooltip content="重置密码" placement="top">
              <el-button link type="warning" :icon="Lock" @click="handleResetPwd(row)" />
            </el-tooltip>
            <el-tooltip :content="row.status === 1 ? '禁用账号' : '启用账号'" placement="top">
              <el-button
                link
                :type="row.status === 1 ? 'info' : 'success'"
                :icon="row.status === 1 ? 'CircleClose' : 'CircleCheck'"
                @click="changeStatus(row)"
              />
            </el-tooltip>
            <el-tooltip content="删除账号" placement="top">
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-card__bottom-bar">
        <div class="table-card__stats-bar">
          <el-icon :size="14" color="#86909c"><DataAnalysis /></el-icon>
          <span>共 <b>{{ total }}</b> 个账号</span>
          <span class="table-card__stats-divider"></span>
          <span>当前显示第 <b>{{ (pageNum - 1) * pageSize + 1 }}</b> - <b>{{ Math.min(pageNum * pageSize, total) }}</b> 条</span>
        </div>
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          @change="getList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑账号' : '新增账号'"
      width="560px"
      :close-on-click-modal="false"
      class="user-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="登录账号" prop="username">
          <el-input
            v-model="form.username"
            :disabled="!!form.id"
            :placeholder="form.id ? '创建后账号不可修改' : '请输入登录账号'"
          />
        </el-form-item>
        <el-form-item label="登录密码" prop="password" v-if="!form.id">
          <el-input v-model="form.password" show-password placeholder="请输入初始密码，至少 6 位" />
        </el-form-item>
        <el-form-item label="姓名/昵称" prop="nickName">
          <el-input v-model="form.nickName" placeholder="请输入显示名称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入 11 位手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-radio-group v-model="form.role">
            <el-radio :value="2">巡检员</el-radio>
            <el-radio :value="1">超级管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="正常使用"
            inactive-text="已禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="resetPwdVisible"
      title="重置密码"
      width="440px"
      :close-on-click-modal="false"
    >
      <el-form ref="resetPwdFormRef" :model="resetPwdForm" :rules="resetPwdRules" label-width="90px">
        <el-form-item label="登录账号">
          <el-input :model-value="resetPwdForm.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPwdForm.password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPwdForm.confirmPassword"
            show-password
            placeholder="再次输入新密码"
            @keyup.enter="submitResetPwd"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="warning" @click="submitResetPwd" :loading="resetLoading">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  RefreshLeft,
  Edit,
  Delete,
  Search,
  User,
  UserFilled,
  Finished,
  Lock,
  CircleClose,
  CircleCheck,
  DataAnalysis
} from '@element-plus/icons-vue'
import {
  getUserList,
  addUser,
  updateUser,
  deleteUser,
  resetUserPwd,
  changeUserStatus
} from '@/api/user'

const loading = ref(false)
const submitLoading = ref(false)
const resetLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const queryForm = ref({
  keyword: '',
  role: '',
  status: ''
})

const dialogVisible = ref(false)
const formRef = ref(null)
const form = ref(getInitForm())

const rules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  nickName: [{ required: true, message: '请输入姓名/昵称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

function getInitForm () {
  return {
    id: null,
    username: '',
    password: '',
    nickName: '',
    phone: '',
    role: 2,
    status: 1
  }
}

const resetPwdVisible = ref(false)
const resetPwdFormRef = ref(null)
const resetPwdForm = reactive({
  userId: null,
  username: '',
  password: '',
  confirmPassword: ''
})
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== resetPwdForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}
const resetPwdRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const getList = async () => {
  loading.value = true
  try {
    const kw = queryForm.value.keyword
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: kw || undefined,
      username: kw || undefined,
      nickName: kw || undefined,
      phone: kw || undefined,
      role: queryForm.value.role === '' ? undefined : queryForm.value.role,
      status: queryForm.value.status === '' ? undefined : queryForm.value.status
    }
    const res = await getUserList(params)
    tableData.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (_) {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  getList()
}
const handleReset = () => {
  queryForm.value = { keyword: '', role: '', status: '' }
  pageNum.value = 1
  getList()
}

const openDialog = (row) => {
  if (formRef.value) formRef.value.clearValidate()
  if (row) {
    form.value = { ...getInitForm(), ...row }
  } else {
    form.value = getInitForm()
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (_) {
    return
  }
  submitLoading.value = true
  try {
    if (form.value.id) {
      await updateUser(form.value)
      ElMessage.success('更新成功')
    } else {
      await addUser(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } finally {
    submitLoading.value = false
  }
}

const changeStatus = async (row) => {
  const tip = row.status === 1
    ? `确定要禁用账号「${row.username}」吗？`
    : `确定要启用账号「${row.username}」吗？`
  try {
    await ElMessageBox.confirm(tip, '提示', { type: 'warning' })
    await changeUserStatus({ id: row.id, status: row.status === 1 ? 0 : 1 })
    ElMessage.success('状态修改成功')
    getList()
  } catch (_) {}
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账号「${row.username}」吗？删除后不可恢复！`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        confirmButtonClass: 'el-button--danger'
      }
    )
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (_) {}
}

const handleResetPwd = (row) => {
  resetPwdForm.userId = row.id
  resetPwdForm.username = row.username
  resetPwdForm.password = ''
  resetPwdForm.confirmPassword = ''
  if (resetPwdFormRef.value) resetPwdFormRef.value.clearValidate()
  resetPwdVisible.value = true
}

const submitResetPwd = async () => {
  if (!resetPwdFormRef.value) return
  try {
    await resetPwdFormRef.value.validate()
  } catch (_) {
    return
  }
  resetLoading.value = true
  try {
    await resetUserPwd({
      userId: resetPwdForm.userId,
      password: resetPwdForm.password
    })
    ElMessage.success('密码重置成功，已告知用户尽快登录修改')
    resetPwdVisible.value = false
  } catch (err) {
    ElMessage.error(err?.message || '重置密码失败')
  } finally {
    resetLoading.value = false
  }
}

const formatTime = (t) => {
  if (!t) return '—'
  return String(t).replace('T', ' ').slice(0, 16)
}

onMounted(getList)
</script>

<style scoped lang="scss">
.user-manage {
  padding: 4px 2px 10px;

  .page-header {
    margin-bottom: 18px;

    &__title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 600;
      color: #1d2129;
    }

    &__icon {
      color: #fff;
      background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
      padding: 6px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);
    }

    &__subtitle {
      margin-top: 6px;
      font-size: 13px;
      color: #86909c;
    }
  }

  .filter-card,
  .table-card {
    border: 1px solid #eef0f3;
    border-radius: 10px;
    overflow: hidden;

    :deep(.el-card__body) {
      padding: 16px 20px;
    }
  }

  .filter-card {
    margin-bottom: 14px;
    background: #fbf6ff;

    &__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      column-gap: 20px;
      row-gap: 8px;
      flex-wrap: wrap;
    }

    .filter-form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      flex: 1;
      min-width: 0;
      row-gap: 4px;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }

    &__actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
  }

  .table-card {
    background: #fff;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      &-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }

    &__bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px dashed #eef0f3;
      flex-wrap: wrap;
      gap: 10px;
    }

    &__stats-bar {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #4e5969;

      b {
        color: #9b59b6;
        font-size: 13px;
        font-weight: 600;
        margin: 0 2px;
      }
    }

    &__stats-divider {
      display: inline-block;
      width: 1px;
      height: 12px;
      background: #e5e6eb;
      margin: 0 4px;
    }
  }

  .user-table {
    :deep(.el-table__header-wrapper) {
      th.el-table__cell {
        background-color: #fafbfc;
        color: #4e5969;
        font-weight: 500;
        border-bottom: 1px solid #eef0f3;
        border-right: 1px solid #eef0f3;

        &:last-child { border-right: none; }
      }
    }

    :deep(.el-table__row) {
      transition: background-color 0.15s ease;

      &:hover td.el-table__cell {
        background-color: #fbf6ff !important;
      }
    }

    :deep(.el-table td.el-table__cell),
    :deep(.el-table th.el-table__cell.is-leaf) {
      border-bottom: 1px solid #f2f3f5;
    }

    :deep(td.el-table__cell) {
      border-right: 1px solid #eef0f3;

      &:last-child { border-right: none; }
    }

    :deep(.el-table__fixed-right-patch),
    :deep(.el-table__fixed-right) {
      th.el-table__cell:first-child,
      td.el-table__cell:first-child { border-left: 1px solid #eef0f3; }
      th.el-table__cell,
      td.el-table__cell {
        border-right: 1px solid #eef0f3;
        &:last-child { border-right: none; }
      }
    }

    :deep(.el-table::before) { display: none; }

    :deep(.el-table__inner-wrapper) {
      border-radius: 8px;
      overflow: hidden;
    }
  }

  .col-avatar {
    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
    color: #fff;
    font-weight: 500;
    font-size: 14px;
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(155, 89, 182, 0.25);
  }

  .col-username {
    color: #409eff;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
    font-size: 13px;
  }

  .col-name {
    color: #1d2129;
    font-weight: 500;
  }

  .col-time {
    color: #86909c;
    font-size: 13px;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
  }

  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
    animation: pulse 2s infinite;

    &--success {
      background: #52c41a;
      box-shadow: 0 0 0 3px rgba(82, 196, 26, 0.15);
    }
    &--danger {
      background: #ff4d4f;
      box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.15);
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  .text-muted { color: #c9cdd4; }

  .user-dialog {
    :deep(.el-dialog) {
      border-radius: 12px;
      overflow: hidden;
    }
  }
}
</style>
