<template>
  <div class="record-manage">
    <div class="page-header">
      <div class="page-header__title">
        <el-icon class="page-header__icon" :size="22"><Reading /></el-icon>
        <span>巡检记录</span>
      </div>
      <div class="page-header__subtitle">查看巡检员打卡明细，支持按点位、人员、时间与状态筛选并导出 Excel</div>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-card__inner">
        <el-form :inline="true" :model="queryForm" class="filter-form">
          <el-form-item label="点位名称">
            <el-select
              v-model="queryForm.pointId"
              placeholder="全部点位"
              filterable
              clearable
              value-type="number"
              style="width:180px"
            >
              <el-option
                v-for="p in pointOptions"
                :key="p.id"
                :label="p.pointName || p.name"
                :value="p.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="巡检人员">
            <el-select
              v-model="queryForm.userId"
              placeholder="全部人员"
              filterable
              clearable
              value-type="number"
              style="width:160px"
            >
              <el-option
                v-for="u in userOptions"
                :key="u.id"
                :label="u.nickName || u.username"
                :value="u.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="打卡状态">
            <el-select v-model="queryForm.checkStatus" placeholder="全部" clearable value-type="number" style="width:130px">
              <el-option label="正常" :value="1" />
              <el-option label="异常" :value="2" />
              <el-option label="漏检" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="打卡时间">
            <el-date-picker
              v-model="queryForm.timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width:260px"
            />
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
          <el-button type="success" :icon="Download" :loading="exportLoading" @click="handleExport">
            <span>导出 Excel</span>
          </el-button>
        </div>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" circle @click="getList" />
        </el-tooltip>
      </div>

      <el-table :data="tableData" empty-text="暂无巡检记录" v-loading="loading" class="record-table" stripe style="width:100%">
        <el-table-column label="点位名称" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="openDetail(row)" class="col-link">
              <el-icon :size="13"><View /></el-icon>
              <span>{{ getPointName(row.pointId) }}</span>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="所属区域" width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" effect="plain" type="info">{{ row.area || '未设置' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="巡检人员" width="150" align="center">
          <template #default="{ row }">
            <div class="col-user">
              <el-avatar :size="24" class="col-user__avatar">
                <el-icon :size="14"><User /></el-icon>
              </el-avatar>
              <span class="col-user__name">{{ getUserName(row.userId) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="打卡时间" width="160" align="center">
          <template #default="{ row }">
            <span class="col-time">{{ formatTime(row.checkTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="打卡位置" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.longitude && row.latitude">
              <el-icon :size="13" color="#409eff"><Place /></el-icon>
              <span class="col-geo">
                {{ Number(row.longitude).toFixed(5) }}, {{ Number(row.latitude).toFixed(5) }}
              </span>
            </template>
            <span v-else class="text-muted">未获取位置</span>
          </template>
        </el-table-column>
        <el-table-column label="打卡图片" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.imgUrl"
              :src="row.imgUrl"
              :preview-src-list="[row.imgUrl]"
              fit="cover"
              class="col-img"
              style="width:42px;height:42px;border-radius:6px;border:1px solid #eef0f3"
            />
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="坐标距离(米)" width="120" align="center">
          <template #default="{ row }">
            <span class="text-muted">{{row.distanceMeter}}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="['status-dot', getStatusClass(row.checkStatus)]"></span>
            <el-tag :type="getStatusTag(row.checkStatus)" effect="light" size="small" round>
              {{ getStatusText(row.checkStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备信息" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="col-device">{{ row.deviceInfo || '—' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-card__bottom-bar">
        <div class="table-card__stats-bar">
          <el-icon :size="14" color="#86909c"><DataAnalysis /></el-icon>
          <span>共 <b>{{ total }}</b> 条巡检记录</span>
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
      v-model="detailVisible"
      title="巡检记录详情"
      width="640px"
      class="record-detail-dialog"
    >
      <el-descriptions
        v-if="detailData"
        :column="2"
        border
        class="inspect-detail-table"
      >
        <el-descriptions-item label="记录ID">
          {{ detailData.id }}
        </el-descriptions-item>
        <el-descriptions-item label="打卡状态">
          <el-tag :type="getStatusTag(detailData.checkStatus)" effect="light" round>
            {{ getStatusText(detailData.checkStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="巡检点位">
          {{ getPointName(detailData.pointId) }}
        </el-descriptions-item>
        <el-descriptions-item label="所属区域">
          {{ detailData.area || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="巡检人员">
          {{ getUserName(detailData.userId) }}
        </el-descriptions-item>
        <el-descriptions-item label="打卡时间">
          {{ formatTime(detailData.checkTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="打卡位置" :span="2">
          <template v-if="detailData.longitude && detailData.latitude">
            <el-icon :size="13" color="#409eff"><Place /></el-icon>
            经度 {{ detailData.longitude }}，纬度 {{ detailData.latitude }}
          </template>
          <span v-else class="text-muted">未获取位置信息</span>
        </el-descriptions-item>
        <el-descriptions-item label="打卡图片" :span="2">
          <el-image
            v-if="detailData.imgUrl"
            :src="detailData.imgUrl"
            :preview-src-list="[detailData.imgUrl]"
            fit="cover"
            class="detail-img"
          />
          <span v-else class="text-muted">未上传现场图片</span>
        </el-descriptions-item>
        <el-descriptions-item label="设备信息" :span="2">
          <code class="detail-device">{{ detailData.deviceInfo || '—' }}</code>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          <span v-if="detailData.remark">{{ detailData.remark }}</span>
          <span v-else class="text-muted">无备注</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  RefreshLeft,
  Search,
  Reading,
  User,
  Place,
  View,
  Download,
  DataAnalysis
} from '@element-plus/icons-vue'
import {
  getRecordList,
  getRecordDetail,
  exportRecord,
  getPointSelect,
  getUserSelect
} from '@/api/record'

const loading = ref(false)
const exportLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const pointOptions = ref([])
const userOptions = ref([])

const queryForm = ref({
  pointId: '',
  userId: '',
  checkStatus: '',
  timeRange: []
})

const detailVisible = ref(false)
const detailData = ref(null)

const getPointName = (pid) => {
  if (!pid) return '—'
  const p = pointOptions.value.find(i => i.id === pid)
  return p ? (p.pointName || p.name) : `点位#${pid}`
}
const getUserName = (uid) => {
  if (!uid) return '—'
  const u = userOptions.value.find(i => i.id === uid)
  return u ? (u.nickName || u.username) : `用户#${uid}`
}

const getStatusText = (s) => {
  if (s === 1) return '正常'
  if (s === 2) return '异常'
  return '漏检'
}
const getStatusTag = (s) => {
  if (s === 1) return 'success'
  if (s === 2) return 'warning'
  return 'danger'
}
const getStatusClass = (s) => {
  if (s === 1) return 'status-dot--success'
  if (s === 2) return 'status-dot--warning'
  return 'status-dot--danger'
}

const loadOptions = async () => {
  try {
    const [pr, ur] = await Promise.all([getPointSelect(), getUserSelect()])
    pointOptions.value = (pr.data || []).map(item => ({
      id: item.value,
      pointName: item.label
    }))
    userOptions.value = (ur.data || []).map(item => ({
      id: item.value,
      username: item.label
    }))
  } catch (_) {}
}

const getList = async () => {
  loading.value = true
  try {
    const params = {
      current: pageNum.value,
      size: pageSize.value,
      pointId: queryForm.value.pointId || undefined,
      userId: queryForm.value.userId || undefined,
      checkStatus: queryForm.value.checkStatus === '' ? undefined : queryForm.value.checkStatus
    }
    if (queryForm.value.timeRange && queryForm.value.timeRange.length === 2) {
      params.startTime = queryForm.value.timeRange[0] + ' 00:00:00'
      params.endTime = queryForm.value.timeRange[1] + ' 23:59:59'
    }
    const res = await getRecordList(params)
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
  queryForm.value = { pointId: '', userId: '', checkStatus: '', timeRange: [] }
  pageNum.value = 1
  getList()
}

const handleExport = async () => {
  if (exportLoading.value) return
  exportLoading.value = true
  try {
    const params = {
      pointId: queryForm.value.pointId || undefined,
      userId: queryForm.value.userId || undefined,
      checkStatus: queryForm.value.checkStatus === '' ? undefined : queryForm.value.checkStatus
    }
    if (queryForm.value.timeRange && queryForm.value.timeRange.length === 2) {
      params.startTime = queryForm.value.timeRange[0] + ' 00:00:00'
      params.endTime = queryForm.value.timeRange[1] + ' 23:59:59'
    }
    const res = await exportRecord(params)
    const blob = new Blob([res.data])
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `巡检记录_${Date.now()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (_) {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

const openDetail = async (row) => {
  try {
    const res = await getRecordDetail(row.id)
    detailData.value = res.data || row
  } catch (_) {
    detailData.value = row
  }
  detailVisible.value = true
}

const formatTime = (t) => {
  if (!t) return '—'
  return String(t).replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  loadOptions()
  getList()
})
</script>

<style scoped lang="scss">
.record-manage {
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
      background: linear-gradient(135deg, #27ae60 0%, #16a085 100%);
      padding: 6px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
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
    background: #f6fff9;

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

    .filter-form__search-actions {
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
        color: #27ae60;
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

  .record-table {
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
        background-color: #f4fff8 !important;
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

    :deep(.el-table::before) { display: none; }

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
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
    }

    &__name {
      font-size: 13px;
      color: #4e5969;
    }
  }

  .col-time {
    color: #86909c;
    font-size: 13px;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
  }

  .col-geo {
    font-family: 'SF Mono', Menlo, Consolas, monospace;
    font-size: 12px;
    color: #4e5969;
    margin-left: 2px;
  }

  .col-device {
    font-size: 12px;
    color: #86909c;
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
    &--warning {
      background: #faad14;
      box-shadow: 0 0 0 3px rgba(250, 173, 20, 0.15);
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

  .text-muted { color: #86909c; }
  .record-detail-dialog {
    :deep(.el-dialog) {
      border-radius: 12px;
      overflow: hidden;
    }
    :deep(.el-dialog__header) {
      padding: 18px 20px 14px;
      border-bottom: 1px solid #f0f2f5;
    }
    :deep(.el-dialog__body) {
      padding: 20px;
      background-color: #fafbfc;
    }
    :deep(.el-dialog__footer) {
      padding: 14px 20px;
      border-top: 1px solid #f0f2f5;
    }
  }
  .inspect-detail-table {
    border-radius: 8px;
    overflow: hidden;

    :deep(.el-descriptions__label) {
      width: 94px;
      background-color: #f7f8fa;
      color: #6b778c;
      font-weight: 500;
      border-color: #e8eaf2;
    }
    :deep(.el-descriptions__content) {
      color: #1d2129;
      border-color: #e8eaf2;
    }
    :deep(.el-descriptions__body) {
      background-color: #ffffff;
    }
  }

  .detail-img {
    width: 100%;
    max-width: 360px;
    border-radius: 8px;
    border: 1px solid #eef0f3;
  }

  .detail-device {
    display: inline-block;
    padding: 2px 8px;
    background: #f4f5f7;
    border-radius: 4px;
    font-size: 12px;
    color: #4e5969;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
    word-break: break-all;
  }
}
</style>