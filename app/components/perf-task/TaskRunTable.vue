<script setup lang="ts">
import type { PerfTaskRunItem } from '~/shared/types/perfTask'

defineProps<{
  runs: PerfTaskRunItem[]
}>()
</script>

<template>
  <section class="surface-card surface-section">
    <div>
      <h2 class="section-title">单次结果</h2>
      <p class="section-subtitle">每次执行都会记录核心指标与 DebugBear 详情链接。</p>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>状态</th>
            <th>LCP</th>
            <th>FCP</th>
            <th>INP</th>
            <th>TBT</th>
            <th>CLS</th>
            <th>TTFB</th>
            <th>详情</th>
            <th>错误信息</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="run in runs" :key="`run-${run.runIndex}`">
            <td>{{ run.runIndex }}</td>
            <td>
              <span class="status-badge" :class="run.status === 'success' ? 'status-completed' : 'status-failed'">
                {{ run.status === 'success' ? '成功' : '失败' }}
              </span>
            </td>
            <td>{{ run.lcp ?? '-' }}</td>
            <td>{{ run.fcp ?? '-' }}</td>
            <td>{{ run.inp ?? '-' }}</td>
            <td>{{ run.tbt ?? '-' }}</td>
            <td>{{ run.cls ?? '-' }}</td>
            <td>{{ run.ttfb ?? '-' }}</td>
            <td>
              <a v-if="run.debugBearUrl" :href="run.debugBearUrl" target="_blank" rel="noreferrer">
                查看
              </a>
              <span v-else>-</span>
            </td>
            <td>{{ run.errorMessage || '-' }}</td>
            <td>{{ new Date(run.createdAt).toLocaleString() }}</td>
          </tr>
          <tr v-if="runs.length === 0">
            <td colspan="11" class="text-muted">暂无运行记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
