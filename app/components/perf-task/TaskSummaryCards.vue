<script setup lang="ts">
import type { MetricSummary, PerfTaskSummary } from '~/shared/types/perfTask'

defineProps<{
  summary: PerfTaskSummary | null
}>()

const formatMetric = (value: number | null, digits = 2) => {
  if (value === null) {
    return '-'
  }
  return value.toFixed(digits)
}

const items = (metric: MetricSummary, digits = 2) => [
  { label: '平均值', value: formatMetric(metric.avg, digits) },
  { label: '去极值平均', value: formatMetric(metric.trimmedAvg, digits) },
  { label: '最大值', value: formatMetric(metric.max, digits) },
  { label: '最小值', value: formatMetric(metric.min, digits) }
]

const getMetric = (metric: MetricSummary | undefined): MetricSummary => {
  if (metric) {
    return metric
  }

  return {
    avg: null,
    trimmedAvg: null,
    max: null,
    min: null
  }
}
</script>

<template>
  <section class="surface-card surface-section">
    <div>
      <h2 class="section-title">汇总结果</h2>
      <p class="section-subtitle">成功样本数小于 3 时不计算去极值平均值。</p>
    </div>

    <div v-if="summary" class="surface-section">
      <div class="row-inline">
        <span class="status-badge status-completed">成功 {{ summary.successCount }}</span>
        <span class="status-badge status-failed">失败 {{ summary.failCount }}</span>
      </div>

      <div>
        <h3 class="section-subtitle">LCP</h3>
        <div class="metric-grid">
          <div v-for="item in items(getMetric(summary.lcp))" :key="`lcp-${item.label}`" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="section-subtitle">FCP</h3>
        <div class="metric-grid">
          <div v-for="item in items(getMetric(summary.fcp))" :key="`fcp-${item.label}`" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="section-subtitle">TBT</h3>
        <div class="metric-grid">
          <div v-for="item in items(getMetric(summary.tbt))" :key="`tbt-${item.label}`" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="section-subtitle">CLS</h3>
        <div class="metric-grid">
          <div v-for="item in items(getMetric(summary.cls), 3)" :key="`cls-${item.label}`" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="section-subtitle">TTFB</h3>
        <div class="metric-grid">
          <div v-for="item in items(getMetric(summary.ttfb))" :key="`ttfb-${item.label}`" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="section-subtitle">Lab Score</h3>
        <div class="metric-grid">
          <div v-for="item in items(getMetric(summary.labScore))" :key="`labScore-${item.label}`" class="metric-card">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="section-subtitle">Page Weight</h3>
        <div class="metric-grid">
          <div
            v-for="item in items(getMetric(summary.pageWeight))"
            :key="`pageWeight-${item.label}`"
            class="metric-card"
          >
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-muted">暂无可汇总结果，首次执行返回后会自动计算。</p>
  </section>
</template>
