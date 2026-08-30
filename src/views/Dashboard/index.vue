<template>
  <div class="dashboard">
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
              <div class="stat-card__label">今日打卡次数</div>
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
              <div class="stat-card__label">今日未打卡点位</div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Location, Finished, User, Warning } from '@element-plus/icons-vue'
import { getDashboardStat } from '@/api/dashboard'

const stat = ref({
  totalPoint: 0,
  todayCheck: 0,
  normalUser: 0,
  abnormalCount: 0
})

const chartRef = ref(null)
let chartInstance = null

const loadStat = async () => {
  try {
    const res = await getDashboardStat()
    stat.value = res.data
  } catch (_) {
    stat.value = { totalPoint: 0, todayCheck: 0, normalUser: 0, abnormalCount: 0 }
  }
}

const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)

  const days = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    days.push(`${d.getMonth() + 1}-${d.getDate()}`)
  }

  const mockTrend = []

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
        data: stat.value.trendData || mockTrend,
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

const handleResize = () => {
  chartInstance && chartInstance.resize()
}

onMounted(async () => {
  await loadStat()
  await nextTick()
  initChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped lang="scss">
.dashboard {
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
}
</style>