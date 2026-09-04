<template>
  <div class="dashboard">
    <el-card shadow="hover" class="filter-card" style="margin-bottom: 16px">
      <div class="filter-bar">
        <div class="filter-left">
          <span class="filter-label">数据日期</span>
          <div class="filter-shortcut">
            <el-button
              v-for="item in dateShortcuts"
              :key="item.value"
              size="small"
              :type="queryDate === item.value ? 'primary' : ''"
              @click="queryDate = item.value; handleDateChange()"
            >
              {{ item.label }}
            </el-button>
          </div>
        </div>
        <el-date-picker
          v-model="queryDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card--blue">
          <div class="stat-card__inner">
            <div class="stat-card__info">
              <div class="stat-card__num">{{ stat.totalPoint }}</div>
              <div class="stat-card__label">总巡检点位</div>
            </div>
            <div class="stat-card__icon">
              <el-icon :size="30"><Location /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card--green">
          <div class="stat-card__inner">
            <div class="stat-card__info">
              <div class="stat-card__num">{{ stat.todayCheck }}</div>
              <div class="stat-card__label">{{ isToday ? '今日打卡次数' : '当日打卡次数' }}</div>
            </div>
            <div class="stat-card__icon">
              <el-icon :size="30"><Finished /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card--orange">
          <div class="stat-card__inner">
            <div class="stat-card__info">
              <div class="stat-card__num">{{ stat.normalUser }}</div>
              <div class="stat-card__label">在岗巡检人员</div>
            </div>
            <div class="stat-card__icon">
              <el-icon :size="30"><User /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card--red">
          <div class="stat-card__inner">
            <div class="stat-card__info">
              <div class="stat-card__num">{{ stat.abnormalCount }}</div>
              <div class="stat-card__label">{{ isToday ? '今日未打卡点位' : '当日未打卡点位' }}</div>
            </div>
            <div class="stat-card__icon">
              <el-icon :size="30"><Warning /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="24">
        <el-card shadow="hover">
          <div ref="chartRef" class="trend-chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="24">
        <el-card shadow="hover">
          <div ref="userBarChartRef" class="user-bar-chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Location, Finished, User, Warning } from '@element-plus/icons-vue'
import { getDashboardStat } from '@/api/dashboard'

const queryDate = ref(new Date().toISOString().slice(0, 10))
const nowStr = ref(new Date().toISOString().slice(0, 10))
const isToday = computed(() => queryDate.value === nowStr.value)

const dateShortcuts = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10)
  return [
    { label: '今天', value: today },
    { label: '昨天', value: yesterday },
  ]
})

const stat = ref({
  totalPoint: 0,
  todayCheck: 0,
  normalUser: 0,
  abnormalCount: 0,
  trendData: [],
  userTodayCheckList: []
})

const chartRef = ref(null)
const userBarChartRef = ref(null)
let chartInstance = null
let userBarInstance = null

const handleDateChange = () => {
  loadStat()
}

const loadStat = async () => {
  try {
    const res = await getDashboardStat(queryDate.value)
    stat.value = res.data
    await nextTick()
    initChart()
    initUserBarChart()
  } catch (_) {
    stat.value = {
      totalPoint: 0,
      todayCheck: 0,
      normalUser: 0,
      abnormalCount: 0,
      trendData: [],
      userTodayCheckList: []
    }
    await nextTick()
    initChart()
    initUserBarChart()
  }
}

const initChart = () => {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  chartInstance = echarts.init(chartRef.value)

  const days = []
  const endDate = new Date(queryDate.value)
  const realEnd = Number.isNaN(endDate.getTime()) ? new Date() : endDate

  for (let i = 29; i >= 0; i--) {
    const d = new Date(realEnd.getTime() - i * 24 * 60 * 60 * 1000)
    days.push(`${d.getMonth() + 1}-${d.getDate()}`)
  }

  const option = {
    title: {
      text: '近30天巡检趋势',
      left: 8,
      top: 4,
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 50,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: days,
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: {
        color: '#606266',
        interval: 3
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } },
      axisLabel: { color: '#606266' }
    },
    series: [
      {
        name: '巡检打卡次数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        data: stat.value.trendData || [],
        itemStyle: { color: '#409EFF' },
        lineStyle: { width: 3, color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.35)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
          ])
        }
      }
    ]
  }
  chartInstance.setOption(option)
}

const initUserBarChart = () => {
  if (!userBarChartRef.value) return
  if (userBarInstance) {
    userBarInstance.dispose()
    userBarInstance = null
  }
  userBarInstance = echarts.init(userBarChartRef.value)

  const list = stat.value.userTodayCheckList ?? []
  const sortList = [...list].sort((a, b) => b.todayCheckCount - a.todayCheckCount)
  const yData = sortList.map(item => item.nickName || item.username)
  const xData = sortList.map(item => item.todayCheckCount)

  const option = {
    title: {
      text: '巡检员打卡次数',
      left: 8,
      top: 4,
      textStyle: { fontSize: 16, fontWeight: 600, color: '#303133' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50,50,50,0.9)',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '12%',
      right: '6%',
      bottom: '3%',
      top: 50,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '打卡次数',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: yData,
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#606266' }
    },
    series: [
      {
        name: '打卡次数',
        type: 'bar',
        barWidth: '50%',
        data: xData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#85ce61' },
            { offset: 1, color: '#67C23A' }
          ])
        },
        label: {
          show: true,
          position: 'right'
        }
      }
    ]
  }
  userBarInstance.setOption(option)
}

const handleResize = () => {
  chartInstance && chartInstance.resize()
  userBarInstance && userBarInstance.resize()
}

onMounted(async () => {
  await loadStat()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  if (userBarInstance) {
    userBarInstance.dispose()
    userBarInstance = null
  }
})
</script>

<style scoped lang="scss">
.dashboard {
  .filter-card {
    :deep(.el-card__body) {
      padding: 14px 20px;
    }
  }
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .filter-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .filter-label {
    font-weight: 500;
    color: #303133;
    white-space: nowrap;
  }
  .filter-shortcut {
    display: flex;
    gap: 8px;
  }

  .stat-card {
    border: none;
    border-radius: 10px;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }

    :deep(.el-card__body) {
      padding: 20px;
    }

    &__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &__info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    &__num {
      font-size: 30px;
      font-weight: 700;
      line-height: 1.2;
    }

    &__label {
      font-size: 13px;
      color: #909399;
    }

    &__icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &--blue {
      .stat-card__num { color: #409EFF; }
      .stat-card__icon {
        background: rgba(64, 158, 255, 0.12);
        color: #409EFF;
      }
    }

    &--green {
      .stat-card__num { color: #67C23A; }
      .stat-card__icon {
        background: rgba(103, 194, 58, 0.12);
        color: #67C23A;
      }
    }

    &--orange {
      .stat-card__num { color: #E6A23C; }
      .stat-card__icon {
        background: rgba(230, 162, 60, 0.12);
        color: #E6A23C;
      }
    }

    &--red {
      .stat-card__num { color: #F56C6C; }
      .stat-card__icon {
        background: rgba(245, 108, 108, 0.12);
        color: #F56C6C;
      }
    }
  }

  .trend-chart {
    width: 100%;
    height: 360px;
  }

  .user-bar-chart {
    width: 100%;
    height: 380px;
  }
}
</style>