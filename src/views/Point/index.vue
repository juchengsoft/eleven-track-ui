<template>
  <div class="point-manage">
    <div class="page-header">
      <div class="page-header__title">
        <el-icon class="page-header__icon" :size="22"><Location /></el-icon>
        <span>点位管理</span>
      </div>
      <div class="page-header__subtitle">维护 NFC 巡检点位基础信息，分配责任人并生成打卡链接</div>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-card__inner">
        <el-form :inline="true" :model="queryForm" class="filter-form">
          <el-form-item label="点位名称">
            <el-input
              v-model="queryForm.pointName"
              placeholder="请输入点位名称"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="所属区域">
            <el-input v-model="queryForm.area" placeholder="请输入所属区域" clearable @keyup.enter="handleSearch">
              <template #prefix><el-icon><MapLocation /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryForm.status" placeholder="全部" clearable style="width:130px">
              <el-option label="正常启用" :value="1" />
              <el-option label="已停用" :value="0" />
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
          <el-button type="primary" :icon="Plus" @click="openDialog()">新增点位</el-button>
        </div>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" circle @click="getList" />
        </el-tooltip>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        class="point-table"
        empty-text="暂无点位数据"
        stripe
        style="width:100%"
      >
        <el-table-column label="点位编号" prop="pointId" width="160" show-overflow-tooltip />
        <el-table-column label="点位名称" prop="pointName" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="col-name">{{ row.pointName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="所属区域" prop="area" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" effect="plain" type="info">{{ row.area }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="经度" prop="longitude" width="140" show-overflow-tooltip />
        <el-table-column label="纬度" prop="latitude" width="140" show-overflow-tooltip />
        <el-table-column label="详细地址" prop="address" min-width="180" show-overflow-tooltip />
        <el-table-column label="负责人" width="110" align="center">
          <template #default="{ row }">
            <div class="col-user">
              <el-avatar :size="24" class="col-user__avatar">
                <el-icon :size="14"><User /></el-icon>
              </el-avatar>
              <span class="col-user__name">{{ getResponsibleName(row.userId) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="NFC链接" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.nfcLink">
              <el-link type="primary" :underline="false" @click="copyLink(row)" class="col-link">
                <el-icon :size="13"><Link /></el-icon>
                <span>{{ row.nfcLink }}</span>
              </el-link>
            </template>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sort" width="70" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="['status-dot', row.status === 1 ? 'status-dot--success' : 'status-dot--danger']"></span>
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light" size="small" round>
              {{ row.status === 1 ? '正常启用' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="{ row }">
            <span class="col-time">{{ formatTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="复制NFC链接" placement="top">
              <el-button link type="primary" :icon="CopyDocument" @click="copyLink(row)" />
            </el-tooltip>
            <el-tooltip content="编辑" placement="top">
              <el-button link type="primary" :icon="Edit" @click="openDialog(row)" />
            </el-tooltip>
            <el-tooltip :content="row.status === 1 ? '停用' : '启用'" placement="top">
              <el-button
                link
                :type="row.status === 1 ? 'warning' : 'success'"
                :icon="row.status === 1 ? 'CircleClose' : 'CircleCheck'"
                @click="changeStatus(row)"
              />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-card__bottom-bar">
        <div class="table-card__stats-bar">
          <el-icon :size="14" color="#86909c"><DataAnalysis /></el-icon>
          <span>共 <b>{{ total }}</b> 条点位数据</span>
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
      :title="form.id ? '编辑点位' : '新增点位'"
      width="720px"
      :close-on-click-modal="false"
      class="point-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="point-dialog__form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="点位编号" prop="pointId">
              <el-input
                v-model="form.pointId"
                placeholder="新增时填写，编辑不可修改"
                :disabled="!!form.id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="点位名称" prop="pointName">
              <el-input v-model="form.pointName" placeholder="如：1号楼东侧消防栓" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="所属区域" prop="area">
              <el-input v-model="form.area" placeholder="如：A区" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" :max="9999" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input-number v-model="form.longitude" :precision="8" style="width:100%" placeholder="请输入经度" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input-number v-model="form.latitude" :precision="8" style="width:100%" placeholder="请输入纬度" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="负责人" prop="userId">
              <el-select v-model="form.userId" placeholder="请选择负责人" filterable clearable style="width:100%">
                <el-option
                  v-for="u in userOptions"
                  :key="u.id"
                  :label="u.nickName || u.username"
                  :value="u.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="详细地址" prop="address">
              <el-input v-model="form.address" placeholder="详细到楼栋、楼层、房间号" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="NFC链接" prop="nfcLink">
              <el-input v-model="form.nfcLink" placeholder="可手动填写，留空则由后端自动生成">
                <template #append>
                  <el-button @click="generateNfcLink">生成链接</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  RefreshLeft,
  Edit,
  Delete,
  CopyDocument,
  Search,
  Location,
  MapLocation,
  User,
  Link,
  CircleClose,
  CircleCheck,
  DataAnalysis
} from '@element-plus/icons-vue'
import {
  getPointList,
  addPoint,
  updatePoint,
  deletePoint,
  changePointStatus
} from '@/api/point'
import { getUserSelect } from '@/api/record'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const userOptions = ref([])

const queryForm = ref({
  pointName: '',
  area: '',
  status: ''
})

const dialogVisible = ref(false)
const formRef = ref(null)
const form = ref(getInitForm())

const rules = {
  pointName: [{ required: true, message: '请输入点位名称', trigger: 'blur' }],
  area: [{ required: true, message: '请输入所属区域', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

function getInitForm () {
  return {
    id: null,
    pointId: '',
    pointName: '',
    area: '',
    longitude: null,
    latitude: null,
    address: '',
    nfcLink: '',
    userId: null,
    status: 1,
    remark: '',
    sort: 0
  }
}

const loadUserOptions = async () => {
  try {
    const res = await getUserSelect()
    userOptions.value = res.data || []
  } catch (_) {}
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getPointList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      ...queryForm.value
    })
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
  queryForm.value = { pointName: '', area: '', status: '' }
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

const generateNfcLink = () => {
  const token = Date.now() + Math.floor(Math.random() * 1000)
  form.value.nfcLink = `${window.location.origin}/check/${token}`
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
      await updatePoint(form.value)
      ElMessage.success('更新成功')
    } else {
      await addPoint(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } finally {
    submitLoading.value = false
  }
}

const copyLink = async (row) => {
  if (!row.nfcLink) {
    ElMessage.warning('该点位暂无NFC链接')
    return
  }
  try {
    await navigator.clipboard.writeText(row.nfcLink)
    ElMessage.success('链接已复制，可写入NFC标签')
  } catch (_) {
    ElMessage.warning('复制失败，请手动复制')
  }
}

const changeStatus = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要${row.status === 1 ? '停用' : '启用'}该点位吗？`,
      '提示',
      { type: 'warning' }
    )
    await changePointStatus({ id: row.id, status: row.status === 1 ? 0 : 1 })
    ElMessage.success('状态修改成功')
    getList()
  } catch (_) {}
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除点位「${row.pointName}」吗？`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确定删除', confirmButtonClass: 'el-button--danger' }
    )
    await deletePoint(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (_) {}
}

const getResponsibleName = (uid) => {
  if (!uid) return '—'
  const u = userOptions.value.find(item => item.id === uid)
  return u ? (u.nickName || u.username) : `用户#${uid}`
}

const formatTime = (t) => {
  if (!t) return '—'
  return String(t).replace('T', ' ').slice(0, 16)
}

onMounted(() => {
  loadUserOptions()
  getList()
})
</script>

<style scoped lang="scss">
.point-manage {
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
      background: linear-gradient(135deg, #409eff 0%, #2b76d9 100%);
      padding: 6px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
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
      padding: 18px 20px;
    }
  }

  .filter-card {
    margin-bottom: 14px;
    background: #fafcff;

    :deep(.el-card__body) {
      padding: 16px 20px;
    }

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
        color: #409eff;
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

  .point-table {
    :deep(.el-table__header-wrapper) {
      th.el-table__cell {
        background-color: #fafbfc;
        color: #4e5969;
        font-weight: 500;
        border-bottom: 1px solid #eef0f3;
        border-right: 1px solid #eef0f3;

        &:last-child {
          border-right: none;
        }
      }
    }

    :deep(.el-table__row) {
      transition: background-color 0.15s ease;

      &:hover td.el-table__cell {
        background-color: #f7faff !important;
      }
    }

    :deep(.el-table td.el-table__cell),
    :deep(.el-table th.el-table__cell.is-leaf) {
      border-bottom: 1px solid #f2f3f5;
    }

    :deep(td.el-table__cell) {
      border-right: 1px solid #eef0f3;

      &:last-child {
        border-right: none;
      }
    }

    :deep(.el-table__fixed-right-patch),
    :deep(.el-table__fixed-right) {
      th.el-table__cell:first-child,
      td.el-table__cell:first-child {
        border-left: 1px solid #eef0f3;
      }

      th.el-table__cell,
      td.el-table__cell {
        border-right: 1px solid #eef0f3;

        &:last-child {
          border-right: none;
        }
      }
    }

    :deep(.el-table::before) {
      display: none;
    }

    :deep(.el-table__inner-wrapper) {
      border-radius: 8px;
      overflow: hidden;
    }
  }

  .col-name {
    color: #1d2129;
    font-weight: 500;
  }

  .col-user {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &__avatar {
      background: rgba(64, 158, 255, 0.1);
      color: #409eff;
    }

    &__name {
      font-size: 13px;
      color: #4e5969;
    }
  }

  .col-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
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

  .text-muted {
    color: #c9cdd4;
  }

  .point-dialog {
    :deep(.el-dialog) {
      border-radius: 12px;
      overflow: hidden;
    }

    &__form {
      padding: 4px 4px 0;
    }
  }
}
</style>