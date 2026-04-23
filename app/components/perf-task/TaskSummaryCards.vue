<script setup lang="ts">
import type { MetricSummary, PerfTaskSummary } from '~/shared/types/perfTask'

defineProps<{
  summary: PerfTaskSummary | null
}>()

const formatMetric = (value: number | null) => {
  if (value === null) {
    return '-'
  }
  return value.toFixed(2)
}

const items = (metric: MetricSummary) => [
  { label: '平均值', value: formatMetric(metric.avg) },
  { label: '去极值平均', value: formatMetric(metric.trimmedAvg) },
  { label: '最大值', value: formatMetric(metric.max) },
  { label: '最小值', value: formatMetric(metric.min) }
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
          <div v-for="item in items(getMetric(summary.cls))" :key="`cls-${item.label}`" class="metric-card">
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

    <p v-else class="text-muted">任务尚未完成，汇总结果会在执行结束后生成。</p>
  </section>
</template>
