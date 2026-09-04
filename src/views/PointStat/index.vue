<template>
  <div class="point-stat">
    <div class="page-header">
      <div class="page-header__title">
        <el-icon class="page-header__icon" :size="22"><DataBoard /></el-icon>
        <span>点位打卡统计</span>
      </div>
      <div class="page-header__subtitle">按点位维度查看每日打卡频次、最新打卡时间，识别漏检点位</div>
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
          <el-form-item label="统计日期">
            <el-date-picker
              v-model="queryForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width:260px"
            />
          </el-form-item>
          <el-form-item label="打卡情况">
            <el-select v-model="queryForm.checkLevel" placeholder="全部" clearable style="width:140px">
              <el-option label="零打卡" value="zero" />
              <el-option label="低频(1-2次)" value="low" />
              <el-option label="正常(3-5次)" value="normal" />
              <el-option label="高频(5次以上)" value="high" />
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
          <el-button type="success" :icon="Download" :loading="exportLoading" @click="handleExport">
            <span>导出 Excel</span>
          </el-button>
        </div>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" circle @click="handleRefresh" />
        </el-tooltip>
      </div>

      <el-table
        :data="tableData"
        empty-text="暂无统计数据"
        v-loading="loading"
        class="stat-table"
        stripe
        style="width:100%"
      >
        <el-table-column label="点位名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" underline="never" @click="openDetail(row)" class="col-link">
              <el-icon :size="13"><View /></el-icon>
              <span class="col-name">{{ row.pointName }}</span>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="所属区域" width="110" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" effect="plain" type="info">{{ row.area || '未设置' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="经度" prop="longitude" width="140" show-overflow-tooltip />
        <el-table-column label="纬度" prop="latitude" width="140" show-overflow-tooltip />
        <el-table-column label="详细地址" prop="address" min-width="180" show-overflow-tooltip />
        <el-table-column label="统计日期" width="120" align="center">
          <template #default="{ row }">
            <span class="col-date">{{ row.statDate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="打卡次数" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getCountTagType(row.checkCount)" effect="light" size="small" round>
              {{ row.checkCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="打卡时间" width="160" align="center">
          <template #default="{ row }">
            <span class="col-time">{{ formatTime(row.lastCheckTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="活跃度" width="140" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="getProgress(row.checkCount)"
              :stroke-width="8"
              :color="getProgressColor(row.checkCount)"
              :show-text="false"
            />
            <span class="col-level">{{ getLevelText(row.checkCount) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-card__bottom-bar">
        <div class="table-card__stats-bar">
          <el-icon :size="14" color="#86909c"><DataAnalysis /></el-icon>
          <span>共 <b>{{ total }}</b> 条统计记录</span>
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
      title="点位打卡统计详情"
      width="640px"
      class="point-stat-detail-dialog"
    >
      <el-descriptions
        v-if="detailData"
        :column="2"
        border
        class="stat-detail-table"
      >
        <el-descriptions-item label="点位ID">
          {{ detailData.pointId }}
        </el-descriptions-item>
        <el-descriptions-item label="统计日期">
          {{ detailData.statDate || '—' }}
        </el-descriptions-item>

        <el-descriptions-item label="点位名称">
          {{ detailData.pointName }}
        </el-descriptions-item>
        <el-descriptions-item label="所属区域">
          {{ detailData.area || '未设置' }}
        </el-descriptions-item>

        <el-descriptions-item label="经度">
          {{ detailData.longitude ?? '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="纬度">
          {{ detailData.latitude ?? '—' }}
        </el-descriptions-item>

        <el-descriptions-item label="详细地址" :span="2">
          {{ detailData.address || '—' }}
        </el-descriptions-item>

        <el-descriptions-item label="当日打卡数">
          <el-tag :type="getCountTagType(detailData.checkCount)" effect="light" round>
            {{ detailData.checkCount }} 次
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="活跃度状态">
          <el-tag :type="getLevelTagType(detailData.checkCount)" effect="light" round>
            {{ getLevelText(detailData.checkCount) }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="最近打卡时" :span="2">
          {{ formatTime(detailData.lastCheckTime) }}
        </el-descriptions-item>

        <el-descriptions-item label="活跃度占比" :span="2">
          <el-progress
            :percentage="getProgress(detailData.checkCount)"
            :stroke-width="10"
            :color="getProgressColor(detailData.checkCount)"
          />
        </el-descriptions-item>

        <el-descriptions-item label="备注信息" :span="2">
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
  Download,
  DataBoard,
  DataAnalysis,
  View
} from '@element-plus/icons-vue'
import {
  getPointStatList,
  getPointStatDetail,
  exportPointStat
} from '@/api/pointStat'
import { getPointSelect } from '@/api/record'

const loading = ref(false)
const exportLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const pointOptions = ref([])

const detailVisible = ref(false)
const detailData = ref(null)

const getDefaultDateRange = () => {
  const now = new Date()
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = fmt(now)
  return [today, today]
}

const queryForm = ref({
  pointId: '',
  dateRange: getDefaultDateRange(),
  checkLevel: ''
})

const getPointName = (pid) => {
  if (!pid) return '—'
  const p = pointOptions.value.find(i => String(i.id) === String(pid))
  return p ? (p.pointName || p.name) : `点位#${pid}`
}

const getCountTagType = (c) => {
  if (!c || c === 0) return 'danger'
  if (c < 3) return 'warning'
  if (c < 5) return 'success'
  return 'primary'
}

const getLevelTagType = (c) => {
  const v = Number(c) || 0
  if (v === 0) return 'danger'
  if (v < 3) return 'warning'
  if (v < 5) return 'success'
  return 'primary'
}

const getProgress = (c) => {
  const v = Number(c) || 0
  return Math.min(Math.round((v / 5) * 100), 100)
}

const getProgressColor = (c) => {
  const v = Number(c) || 0
  if (v === 0) return '#F56C6C'
  if (v < 3) return '#E6A23C'
  if (v < 5) return '#67C23A'
  return '#409EFF'
}

const getLevelText = (c) => {
  const v = Number(c) || 0
  if (v === 0) return '未打卡'
  if (v < 3) return '低频'
  if (v < 5) return '正常'
  return '活跃'
}

const formatTime = (t) => {
  if (!t) return '—'
  return String(t).replace('T', ' ').substring(0, 16)
}

const loadPointOptions = async () => {
  try {
    const res = await getPointSelect()
    pointOptions.value = (res.data || []).map(item => ({
      id: item.value,
      pointName: item.label
    }))
  } catch (_) {}
}

const buildParams = () => {
  const params = {
    current: pageNum.value,
    size: pageSize.value,
    pointId: queryForm.value.pointId || undefined,
    checkLevel: queryForm.value.checkLevel || undefined
  }
  if (queryForm.value.dateRange && queryForm.value.dateRange.length === 2) {
    params.startDate = queryForm.value.dateRange[0]
    params.endDate = queryForm.value.dateRange[1]
  }
  return params
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getPointStatList(buildParams())
    tableData.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (_) {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  pageNum.value = 1
  getList()
}

const handleSearch = () => {
  handleRefresh()
}

const handleReset = () => {
  queryForm.value = {
    pointId: '',
    dateRange: getDefaultDateRange(),
    checkLevel: ''
  }
  handleRefresh()
}

const handleExport = async () => {
  if (exportLoading.value) return
  exportLoading.value = true
  try {
    const params = { ...buildParams() }
    delete params.current
    delete params.size
    const res = await exportPointStat(params)
    const blob = new Blob([res.data])
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `点位打卡统计_${Date.now()}.xlsx`)
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
  const res = await getPointStatDetail(row.id)
  detailData.value = res.data || row
  detailVisible.value = true
}

onMounted(async () => {
  await loadPointOptions()
  getList()
})
</script>

<style scoped lang="scss">
.point-stat {
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
      background: linear-gradient(135deg, #722ed1 0%, #409eff 100%);
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
      padding: 16px 20px;
    }
  }

  .filter-card {
    margin-bottom: 14px;
    background: #faf7ff;

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
    margin-bottom: 14px;

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
        color: #722ed1;
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

  .stat-table {
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
        background-color: #faf7ff !important;
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

  .col-link {
    display: inline-flex;
    align-items: center;
    gap:4px;
  }

  .col-name {
    color: #1d2129;
    font-weight: 500;
  }

  .col-date {
    font-family: 'SF Mono', Menlo, Consolas, monospace;
    font-size: 12px;
    color: #4e5969;
  }

  .col-time {
    color: #86909c;
    font-size: 12px;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
  }

  .col-level {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: #86909c;
  }

  .text-muted { color:#86909c; }

  /* 详情弹窗样式，和巡检记录保持统一 */
  .point-stat-detail-dialog {
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

  .stat-detail-table {
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
}
</style>