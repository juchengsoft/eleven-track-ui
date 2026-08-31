<template>
  <div class="parking-apply">
    <div class="page-header">
      <div class="page-header__title">
        <el-icon class="page-header__icon" :size="22"><Van /></el-icon>
        <span>访客停车申请</span>
      </div>
      <div class="page-header__subtitle">查看访客自助提交的临时停车申请记录</div>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-card__inner">
        <el-form :inline="true" :model="queryForm" class="filter-form">
          <el-form-item label="关键字">
            <el-input
              v-model="queryForm.keyword"
              placeholder="访客姓名 / 手机号 / 车牌号"
              clearable
              @keyup.enter="handleSearch"
              style="width:280px"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="房号">
            <el-input
              v-model="queryForm.houseNo"
              placeholder="如：1-1-101"
              clearable
              @keyup.enter="handleSearch"
              style="width:160px"
            />
          </el-form-item>
          <el-form-item label="提交时间">
            <el-date-picker
              v-model="queryForm.dateRange"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              clearable
              style="width:240px"
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
          <el-button type="primary" :icon="Link" @click="copyApplyLink">复制录入链接</el-button>
        </div>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" circle @click="getList" />
        </el-tooltip>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        class="apply-table"
        empty-text="暂无访客停车申请"
        stripe
        style="width:100%"
      >
        <el-table-column label="申请编号" prop="applyNo" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="openDetail(row)" class="col-apply-no">
              <el-icon :size="13"><Document /></el-icon>
              <span>{{ row.applyNo }}</span>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="访客姓名" prop="visitorName" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="col-name">{{ row.visitorName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="访客手机号" prop="visitorPhone" width="130" />
        <el-table-column label="车牌号" prop="plateNumber" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" type="warning" round>{{ row.plateNumber }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="被访业主" prop="ownerName" min-width="100" show-overflow-tooltip />
        <el-table-column label="房号" prop="houseNo" width="110" show-overflow-tooltip />
        <el-table-column label="停车时段" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="col-time-range">
              <el-icon :size="12"><Clock /></el-icon>
              <span>{{ formatTime(row.applyStart) }}</span>
              <span class="col-time-arrow">→</span>
              <span>{{ formatTime(row.applyEnd) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.remark">{{ row.remark }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160" align="center">
          <template #default="{ row }">
            <span class="col-time">{{ formatTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="删除" placement="top">
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-card__bottom-bar">
        <div class="table-card__stats-bar">
          <el-icon :size="14" color="#86909c"><DataAnalysis /></el-icon>
          <span>共 <b>{{ total }}</b> 条申请记录</span>
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
      title="申请详情"
      width="560px"
      :close-on-click-modal="true"
      class="apply-dialog"
    >
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="申请编号" :span="2">
          <span class="desc-apply-no">{{ detail.applyNo }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="访客姓名">{{ detail.visitorName }}</el-descriptions-item>
        <el-descriptions-item label="访客手机号">{{ detail.visitorPhone }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">
          <el-tag size="small" effect="plain" type="warning" round>{{ detail.plateNumber }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="被访业主">{{ detail.ownerName }}</el-descriptions-item>
        <el-descriptions-item label="房号">{{ detail.houseNo }}</el-descriptions-item>
        <el-descriptions-item label="停车开始">{{ formatTime(detail.applyStart) }}</el-descriptions-item>
        <el-descriptions-item label="停车结束">{{ formatTime(detail.applyEnd) }}</el-descriptions-item>
        <el-descriptions-item label="提交时间" :span="2">{{ formatTime(detail.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          <span v-if="detail.remark">{{ detail.remark }}</span>
          <span v-else class="text-muted">无</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete(detail)" v-if="detail">删除记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Van,
  Search,
  RefreshLeft,
  Refresh,
  Link,
  Document,
  Clock,
  Delete,
  DataAnalysis
} from '@element-plus/icons-vue'
import { getParkingApplyList, deleteParkingApply } from '@/api/parkingApply'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const queryForm = ref({
  keyword: '',
  houseNo: '',
  dateRange: []
})

const detailVisible = ref(false)
const detail = ref(null)

const getList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: queryForm.value.keyword || undefined,
      houseNo: queryForm.value.houseNo || undefined,
      beginTime: queryForm.value.dateRange?.[0] || undefined,
      endTime: queryForm.value.dateRange?.[1] || undefined
    }
    const res = await getParkingApplyList(params)
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
  queryForm.value = { keyword: '', houseNo: '', dateRange: [] }
  pageNum.value = 1
  getList()
}

const openDetail = (row) => {
  detail.value = { ...row }
  detailVisible.value = true
}

const handleDelete = async (row) => {
  if (!row) return
  try {
    await ElMessageBox.confirm(
      `确定要删除申请「${row.applyNo}」吗？删除后不可恢复！`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确定删除', confirmButtonClass: 'el-button--danger' }
    )
    await deleteParkingApply(row.id)
    ElMessage.success('删除成功')
    detailVisible.value = false
    getList()
  } catch (_) {}
}

const copyApplyLink = async () => {
  const url = `${window.location.origin}/apply/parking`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('录入链接已复制，可分享给访客填写')
  } catch (_) {
    ElMessage.warning('复制失败，请手动复制：' + url)
  }
}

const formatTime = (t) => {
  if (!t) return '—'
  return String(t).replace('T', ' ').slice(0, 16)
}

onMounted(getList)
</script>

<style scoped lang="scss">
.parking-apply {
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
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      padding: 6px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
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
    background: #f0fdfa;

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
        color: #14b8a6;
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

  .apply-table {
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
        background-color: #f0fdfa !important;
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

  .col-apply-no {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
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

  .col-time-range {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #4e5969;
    font-family: 'SF Mono', Menlo, Consolas, monospace;

    .col-time-arrow {
      color: #14b8a6;
      font-weight: 600;
    }
  }

  .text-muted { color: #c9cdd4; }

  .apply-dialog {
    :deep(.el-dialog) {
      border-radius: 12px;
      overflow: hidden;
    }

    .desc-apply-no {
      font-family: 'SF Mono', Menlo, Consolas, monospace;
      color: #14b8a6;
      font-weight: 600;
    }
  }
}
</style>
