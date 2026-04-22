<script setup lang="ts">
import type { PerfTaskListItem } from '~/shared/types/perfTask'

defineProps<{
  items: PerfTaskListItem[]
}>()

const statusLabelMap: Record<string, string> = {
  pending: '待执行',
  running: '执行中',
  completed: '已完成',
  partial_failed: '部分失败',
  failed: '失败'
}
</script>

<template>
  <section class="surface-card surface-section">
    <div>
      <h2 class="section-title">历史任务</h2>
      <p class="section-subtitle">按版本和分组回看执行记录。</p>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>任务 ID</th>
            <th>URL</th>
            <th>版本</th>
            <th>分组</th>
            <th>状态</th>
            <th>进度</th>
            <th>成功/失败</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.taskId">
            <td>
              <NuxtLink :to="`/tasks/${item.taskId}`">{{ item.taskId }}</NuxtLink>
            </td>
            <td>{{ item.url }}</td>
            <td>{{ item.version }}</td>
            <td>{{ item.group }}</td>
            <td>
              <span class="status-badge" :class="`status-${item.status}`">
                {{ statusLabelMap[item.status] || item.status }}
              </span>
            </td>
            <td>{{ item.progressCount }} / {{ item.count }}</td>
            <td>{{ item.successCount }} / {{ item.failCount }}</td>
            <td>{{ new Date(item.createdAt).toLocaleString() }}</td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="8" class="text-muted">暂无任务</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
