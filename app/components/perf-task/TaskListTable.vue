<script setup lang="ts">
import type { PerfTaskListItem } from '~/shared/types/perfTask'

defineProps<{
  items: PerfTaskListItem[]
}>()
const emit = defineEmits<{
  delete: [taskId: string]
  stop: [taskId: string]
}>()

const statusLabelMap: Record<string, string> = {
  pending: '待执行',
  running: '执行中',
  cancelled: '已中止',
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
            <th>URL</th>
            <th>版本</th>
            <th>分组</th>
            <th>状态</th>
            <th>进度</th>
            <th>成功/失败</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.taskId">
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
            <td>
              <div class="row-inline table-actions">
                <NuxtLink class="table-action-button table-action-view" :to="`/tasks/${item.taskId}`">
                  查看
                </NuxtLink>
                <button
                  v-if="item.status === 'pending' || item.status === 'running'"
                  class="table-action-button table-action-stop"
                  type="button"
                  @click="emit('stop', item.taskId)"
                >
                  停止
                </button>
                <button
                  class="table-action-button table-action-delete"
                  type="button"
                  @click="emit('delete', item.taskId)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="8" class="text-muted">暂无任务</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
