<template>
  <div class="repair-page">
    <div class="page-header">
      <div class="page-header__title">
        <el-icon class="page-header__icon" :size="22"><Tools /></el-icon>
        <span>物业报修</span>
      </div>
      <div class="page-header__subtitle">查看业主报修工单及处理进度，可删除无效工单</div>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-card__inner">
        <el-form :inline="true" :model="queryForm" class="filter-form">
          <el-form-item label="关键字">
            <el-input
              v-model="queryForm.keyword"
              placeholder="单号 / 联系人 / 手机号 / 师傅"
              clearable
              @keyup.enter="handleSearch"
              style="width:300px"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="工单状态">
            <el-select v-model="queryForm.orderStatus" placeholder="全部状态" clearable style="width:140px">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
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
          <el-button type="primary" :icon="Link" @click="copyApplyLink">复制报修链接</el-button>
          <el-button type="success" :icon="Download" :loading="exportLoading" @click="handleExport">导出Excel</el-button>
        </div>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" circle @click="getList" />
        </el-tooltip>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        class="repair-table"
        empty-text="暂无报修工单"
        stripe
        style="width:100%"
      >
        <el-table-column label="报修单号" prop="orderNo" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" underline="never" @click="openDetail(row)" class="col-no">
              <el-icon :size="13"><Document /></el-icon>
              <span>{{ row.orderNo }}</span>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="联系人" prop="contactName" min-width="90" show-overflow-tooltip>
          <template #default="{ row }"><span class="col-name">{{ row.contactName }}</span></template>
        </el-table-column>
        <el-table-column label="联系电话" prop="contactPhone" width="130" />
        <el-table-column label="报修内容" prop="repairContent" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.repairContent">{{ row.repairContent }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="90" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.images && row.images.length"
              :src="row.images[0]"
              :preview-src-list="row.images"
              :initial-index="0"
              fit="cover"
              class="col-thumb"
              preview-teleported
            />
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="维修师傅" prop="repairWorker" width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.repairWorker">{{ row.repairWorker }}</span>
            <span v-else class="text-muted">未派单</span>
          </template>
        </el-table-column>
        <el-table-column label="工单状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getRepairStatusTagType(row.orderStatus)" size="small">
              {{ getRepairStatusText(row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160" align="center">
          <template #default="{ row }">
            <span class="col-time">{{ formatRepairTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="160" align="center">
          <template #default="{ row }">
            <span class="col-time">{{ formatRepairTime(row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="派单" placement="top" v-if="row.orderStatus === 3">
              <el-button link type="primary" :icon="SetUp" @click="openDispatch(row)">派单</el-button>
            </el-tooltip>
            <el-tooltip content="验收通过" placement="top" v-else-if="row.orderStatus === 5">
              <el-button link type="success" :icon="CircleCheck" @click="openAccept(row, 6)">验收</el-button>
            </el-tooltip>
            <el-tooltip content="详情" placement="top">
              <el-button link type="primary" :icon="View" @click="openDetail(row)" />
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
          <span>共 <b>{{ total }}</b> 条工单</span>
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
      title="报修工单详情"
      width="680px"
      :close-on-click-modal="true"
      class="repair-dialog"
      destroy-on-close
    >
      <div v-loading="detailLoading">
        <el-descriptions :column="2" border v-if="detail">
          <el-descriptions-item label="报修单号" :span="2">
            <span class="desc-no">{{ detail.orderNo }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detail.contactName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="维修师傅">{{ detail.repairWorker || '未派单' }}</el-descriptions-item>
          <el-descriptions-item label="工单状态">
            <el-tag :type="getRepairStatusTagType(detail.orderStatus)" size="small">
              {{ getRepairStatusText(detail.orderStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatRepairTime(detail.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatRepairTime(detail.updateTime) }}</el-descriptions-item>
          <el-descriptions-item label="报修内容" :span="2">
            <span v-if="detail.repairContent">{{ detail.repairContent }}</span>
            <span v-else class="text-muted">无</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="logs-title">
          <el-icon :size="14"><Clock /></el-icon>
          <span>处理进度</span>
        </div>
        <el-timeline v-if="detailLogs.length" class="logs-timeline">
          <el-timeline-item
            v-for="(log, idx) in detailLogs"
            :key="idx"
            :timestamp="formatRepairTime(log.createTime)"
            placement="top"
            :type="log.operateStatus === 6 ? 'success' : log.operateStatus === 7 || log.operateStatus === 2 ? 'danger' : 'primary'"
          >
            <div class="log-title">{{ getOperateTypeText(log.operateType) }}</div>
            <div class="log-user" v-if="log.operateUser">操作人：{{ log.operateUser }}</div>
            <div class="log-remark" v-if="log.operateRemark">{{ log.operateRemark }}</div>
            <div class="log-images" v-if="log.imageUrls">
              <el-image
                v-for="(url, i) in log.imageUrls.split(',').filter(Boolean)"
                :key="i"
                :src="url"
                :preview-src-list="log.imageUrls.split(',').filter(Boolean)"
                :initial-index="i"
                fit="cover"
                class="log-img"
                preview-teleported
              />
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无处理记录" :image-size="60" />
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :icon="SetUp"
          @click="openDispatch(detail)"
          v-if="detail && detail.orderStatus === 3"
        >
          派单
        </el-button>
        <el-button
          type="success"
          :icon="CircleCheck"
          @click="openAccept(detail, 6)"
          v-else-if="detail && detail.orderStatus === 5"
        >
          验收通过
        </el-button>
        <el-button
          type="warning"
          :icon="CircleClose"
          @click="openAccept(detail, 7)"
          v-if="detail && detail.orderStatus === 5"
        >
          驳回返工
        </el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete(detail)" v-if="detail">删除工单</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dispatchVisible"
      title="派单给维修师傅"
      width="500px"
      :close-on-click-modal="false"
      class="repair-dialog"
      destroy-on-close
    >
      <div class="dispatch-target">
        <span class="dispatch-target__name">{{ dispatchRow?.contactName }}</span>
        <span class="dispatch-target__no">{{ dispatchRow?.orderNo }}</span>
      </div>
      <el-form label-position="top">
        <el-form-item label="维修师傅（可多选）" required>
          <el-select
            v-model="dispatchForm.workerIds"
            multiple
            filterable
            placeholder="请选择维修师傅"
            style="width:100%"
            :loading="workersLoading"
          >
            <el-option
              v-for="w in workerOptions"
              :key="w.id"
              :label="w.nickName || w.username"
              :value="w.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="派单备注（选填）">
          <el-input
            v-model="dispatchForm.remark"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="可填写维修要求或注意事项"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchVisible = false">取消</el-button>
        <el-button type="primary" :loading="dispatchLoading" @click="confirmDispatch">确认派单</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="acceptVisible"
      :title="acceptForm.acceptResult === 6 ? '验收通过' : '验收驳回返工'"
      width="500px"
      :close-on-click-modal="false"
      class="repair-dialog"
      destroy-on-close
    >
      <div class="dispatch-target">
        <span class="dispatch-target__name">{{ acceptRow?.contactName }}</span>
        <span class="dispatch-target__no">{{ acceptRow?.orderNo }}</span>
      </div>
      <el-form label-position="top">
        <el-form-item
          :label="acceptForm.acceptResult === 6 ? '验收意见（选填）' : '返工原因（必填）'"
          :required="acceptForm.acceptResult === 7"
        >
          <el-input
            v-model="acceptForm.remark"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            :placeholder="acceptForm.acceptResult === 6 ? '可填写验收意见' : '请填写返工原因，将退回维修师傅处理'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acceptVisible = false">取消</el-button>
        <el-button
          :type="acceptForm.acceptResult === 6 ? 'success' : 'danger'"
          :loading="acceptLoading"
          @click="confirmAccept"
        >
          {{ acceptForm.acceptResult === 6 ? '确认通过' : '确认驳回返工' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Tools,
  Search,
  RefreshLeft,
  Refresh,
  Link,
  Document,
  Clock,
  Delete,
  DataAnalysis,
  View,
  SetUp,
  CircleCheck,
  CircleClose,
  Download
} from '@element-plus/icons-vue'
import { getRepairList, getRepairDetail, deleteRepairOrder, getRepairWorkers, dispatchRepair, acceptRepair, exportRepairList } from '@/api/repair'
import { downloadBlob } from '@/utils/download'
import {
  getRepairStatusText,
  getRepairStatusTagType,
  getOperateTypeText,
  formatRepairTime
} from '@/views/Repair/status'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const queryForm = ref({
  keyword: '',
  orderStatus: undefined,
  dateRange: []
})

const statusOptions = [
  { label: '待派单', value: 3 },
  { label: '维修中', value: 4 },
  { label: '待验收', value: 5 },
  { label: '已完成', value: 6 },
  { label: '验收驳回', value: 7 }
]

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
const detailLogs = ref([])

const parseImages = (row) => {
  const imgs = []
  if (row.imageUrls) imgs.push(...String(row.imageUrls).split(',').filter(Boolean))
  if (row.images && Array.isArray(row.images)) imgs.push(...row.images)
  return imgs
}

const getList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: queryForm.value.keyword || undefined,
      orderStatus: queryForm.value.orderStatus,
      beginTime: queryForm.value.dateRange?.[0] || undefined,
      endTime: queryForm.value.dateRange?.[1] || undefined
    }
    const res = await getRepairList(params)
    tableData.value = (res.data.records || []).map(r => ({ ...r, images: parseImages(r) }))
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
  queryForm.value = { keyword: '', orderStatus: undefined, dateRange: [] }
  pageNum.value = 1
  getList()
}

const openDetail = async (row) => {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  detailLogs.value = []
  try {
    const res = await getRepairDetail(row.id)
    const data = res.data || {}
    detail.value = { ...row, ...data }
    detailLogs.value = data.logs || data.logList || []
  } catch (_) {
    detail.value = { ...row }
  } finally {
    detailLoading.value = false
  }
}

const handleDelete = async (row) => {
  if (!row) return
  try {
    await ElMessageBox.confirm(
      `确定要删除报修工单「${row.orderNo}」吗？删除后不可恢复！`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确定删除', confirmButtonClass: 'el-button--danger' }
    )
    await deleteRepairOrder(row.id)
    ElMessage.success('删除成功')
    detailVisible.value = false
    getList()
  } catch (_) {}
}

const dispatchVisible = ref(false)
const dispatchLoading = ref(false)
const dispatchRow = ref(null)
const workerOptions = ref([])
const workersLoading = ref(false)
const dispatchForm = reactive({
  workerIds: [],
  remark: ''
})

const openDispatch = async (row) => {
  if (!row) return
  dispatchRow.value = row
  dispatchForm.workerIds = []
  dispatchForm.remark = ''
  dispatchVisible.value = true
  if (workerOptions.value.length === 0) {
    workersLoading.value = true
    try {
      const res = await getRepairWorkers()
      workerOptions.value = res.data || []
    } catch (_) {
      workerOptions.value = []
    } finally {
      workersLoading.value = false
    }
  }
}

const confirmDispatch = async () => {
  if (!dispatchForm.workerIds.length) {
    ElMessage.warning('请至少选择一位维修师傅')
    return
  }
  const workers = workerOptions.value
    .filter(w => dispatchForm.workerIds.includes(w.id))
    .map(w => w.nickName || w.username)
  dispatchLoading.value = true
  try {
    await dispatchRepair({
      id: dispatchRow.value.id,
      workerIds: dispatchForm.workerIds,
      workerNames: workers.join(','),
      remark: dispatchForm.remark.trim() || undefined
    })
    ElMessage.success('派单成功')
    dispatchVisible.value = false
    if (detailVisible.value && detail.value?.id === dispatchRow.value.id) {
      await openDetail(dispatchRow.value)
    } else {
      getList()
    }
  } catch (err) {
    ElMessage.error(err?.message || '派单失败')
  } finally {
    dispatchLoading.value = false
  }
}

const acceptVisible = ref(false)
const acceptLoading = ref(false)
const acceptRow = ref(null)
const acceptForm = reactive({
  acceptResult: 6,
  remark: ''
})

const openAccept = (row, result) => {
  if (!row) return
  acceptRow.value = row
  acceptForm.acceptResult = result
  acceptForm.remark = ''
  acceptVisible.value = true
}

const confirmAccept = async () => {
  if (acceptForm.acceptResult === 7 && !acceptForm.remark.trim()) {
    ElMessage.warning('驳回返工必须填写原因')
    return
  }
  acceptLoading.value = true
  try {
    await acceptRepair({
      id: acceptRow.value.id,
      orderStatus: acceptForm.acceptResult,
      remark: acceptForm.remark.trim() || undefined
    })
    ElMessage.success(acceptForm.acceptResult === 6 ? '已验收通过' : '已驳回返工')
    acceptVisible.value = false
    if (detailVisible.value && detail.value?.id === acceptRow.value.id) {
      await openDetail(acceptRow.value)
    } else {
      getList()
    }
  } catch (err) {
    ElMessage.error(err?.message || '验收失败')
  } finally {
    acceptLoading.value = false
  }
}

const copyApplyLink = async () => {
  const url = `${window.location.origin}/apply/repair`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('报修链接已复制，可分享给业主填写')
  } catch (_) {
    ElMessage.warning('复制失败，请手动复制：' + url)
  }
}

const exportLoading = ref(false)

const handleExport = async () => {
  if (exportLoading.value) return
  exportLoading.value = true
  try {
    const params = {
      keyword: queryForm.value.keyword || undefined,
      orderStatus: queryForm.value.orderStatus,
      beginTime: queryForm.value.dateRange?.[0] || undefined,
      endTime: queryForm.value.dateRange?.[1] || undefined
    }
    const res = await exportRepairList(params)
    downloadBlob(res.data, '报修工单')
    ElMessage.success('导出成功')
  } catch (_) {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

onMounted(getList)
</script>

<style scoped lang="scss">
.repair-page {
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

    :deep(.el-card__body) { padding: 16px 20px; }
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

      :deep(.el-form-item) { margin-bottom: 0; }
    }
  }

  .table-card {
    background: #fff;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      &-left { display: flex; align-items: center; gap: 10px; }
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

      b { color: #14b8a6; font-size: 13px; font-weight: 600; margin: 0 2px; }
    }

    &__stats-divider {
      display: inline-block;
      width: 1px;
      height: 12px;
      background: #e5e6eb;
      margin: 0 4px;
    }
  }

  .repair-table {
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
      &:hover td.el-table__cell { background-color: #f0fdfa !important; }
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

  .col-no {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
  }

  .col-name { color: #1d2129; font-weight: 500; }

  .col-thumb {
    width: 50px;
    height: 50px;
    border-radius: 6px;
    cursor: pointer;
    vertical-align: middle;
  }

  .col-time {
    color: #86909c;
    font-size: 13px;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
  }

  .text-muted { color: #c9cdd4; }

  .repair-dialog {
    :deep(.el-dialog) {
      border-radius: 12px;
      overflow: hidden;
    }

    .desc-no {
      font-family: 'SF Mono', Menlo, Consolas, monospace;
      color: #14b8a6;
      font-weight: 600;
    }
  }

  .dispatch-target {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: #f0fdfa;
    border: 1px solid #ccfbf1;
    border-radius: 8px;

    &__name {
      font-size: 14px;
      font-weight: 600;
      color: #134e4a;
    }

    &__no {
      font-size: 12px;
      color: #0d9488;
      font-family: 'SF Mono', Menlo, Consolas, monospace;
    }
  }

  .logs-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #344054;
    margin: 18px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #eef0f3;

    .el-icon { color: #14b8a6; }
  }

  .logs-timeline { padding-left: 4px; }

  .log-title { font-size: 14px; font-weight: 600; color: #1d2129; }
  .log-user { font-size: 12px; color: #86909c; margin-top: 2px; }
  .log-remark {
    font-size: 13px;
    color: #4e5969;
    margin-top: 4px;
    padding: 6px 10px;
    background: #f7f8fa;
    border-radius: 6px;
    line-height: 1.5;
  }

  .log-images {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .log-img {
    width: 72px;
    height: 72px;
    border-radius: 6px;
    cursor: pointer;
  }
}
</style>
