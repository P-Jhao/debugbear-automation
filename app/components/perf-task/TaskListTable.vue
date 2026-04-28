<script setup lang="ts">
import type { PerfTaskListItem } from '~/shared/types/perfTask'

defineProps<{
  items: PerfTaskListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}>()

const emit = defineEmits<{
  delete: [taskId: string]
  stop: [taskId: string]
  pageChange: [page: number]
  pageSizeChange: [pageSize: number]
}>()

const statusLabelMap: Record<string, string> = {
  pending: '待执行',
  running: '执行中',
  cancelled: '已中止',
  completed: '已完成',
  partial_failed: '部分失败',
  failed: '失败'
}

const deviceLabelMap: Record<PerfTaskListItem['device'], string> = {
  mobile: 'Mobile',
  desktop: 'Desktop',
  unknown: '-'
}

const pageSizeOptions = [5, 10, 20] as const

const onPageSizeSelect = (nextPageSize: number) => {
  emit('pageSizeChange', nextPageSize)
}
</script>

<template>
  <section class="surface-card surface-section">
    <div>
      <h2 class="section-title">历史任务</h2>
      <p class="section-subtitle">按版本、分组和设备回看执行记录。</p>
    </div>

    <div class="table-wrap">
      <table class="task-list-table">
        <colgroup>
          <col />
          <col style="width: 92px" />
          <col style="width: 96px" />
          <col style="width: 84px" />
          <col style="width: 92px" />
          <col style="width: 86px" />
          <col style="width: 168px" />
          <col style="width: 220px" />
        </colgroup>
        <thead>
          <tr>
            <th>URL</th>
            <th>版本</th>
            <th>分组</th>
            <th>设备</th>
            <th>状态</th>
            <th>进度</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.taskId">
            <td>
              <AppTip :content="item.url">
                <span class="url-cell-text">{{ item.url }}</span>
              </AppTip>
            </td>
            <td>{{ item.version }}</td>
            <td>{{ item.group }}</td>
            <td>{{ deviceLabelMap[item.device] }}</td>
            <td>
              <span class="status-badge" :class="`status-${item.status}`">
                {{ statusLabelMap[item.status] || item.status }}
              </span>
            </td>
            <td>{{ item.progressCount }} / {{ item.count }}</td>
            <td class="created-at-cell">{{ new Date(item.createdAt).toLocaleString() }}</td>
            <td class="actions-cell">
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

    <div class="pager-row">
      <span class="text-muted pager-summary">共 {{ total }} 条，第 {{ page }} / {{ totalPages }} 页，每页 {{ pageSize }} 条</span>
      <div class="row-inline pager-actions">
        <span class="pager-size-label">每页</span>
        <div class="pager-size-group" role="radiogroup" aria-label="每页条数">
          <button
            v-for="size in pageSizeOptions"
            :key="size"
            type="button"
            class="pager-size-chip"
            :class="{ 'is-active': pageSize === size }"
            :aria-checked="pageSize === size"
            role="radio"
            @click="onPageSizeSelect(size)"
          >
            {{ size }}
          </button>
        </div>
        <button class="button-secondary pager-button" type="button" :disabled="page <= 1" @click="emit('pageChange', page - 1)">
          上一页
        </button>
        <button class="button-secondary pager-button" type="button" :disabled="page >= totalPages" @click="emit('pageChange', page + 1)">
          下一页
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.task-list-table {
  width: 100%;
  min-width: 100%;
  table-layout: fixed;
}

.task-list-table th:first-child,
.task-list-table td:first-child {
  min-width: 0;
}

.task-list-table th,
.task-list-table td {
  white-space: nowrap;
}

.url-cell-text {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.created-at-cell {
  font-size: 0.88rem;
}

.actions-cell {
  width: 220px;
}

.pager-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pager-summary {
  font-size: 0.88rem;
}

.pager-button {
  min-width: 72px;
  height: 32px;
  padding: 0 10px;
}

.pager-actions {
  gap: 8px;
  flex-wrap: wrap;
}

.pager-size-label {
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.pager-size-group {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  padding: 2px;
  background: var(--bg-surface);
}

.pager-size-chip {
  min-width: 38px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.88rem;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.pager-size-chip:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}

.pager-size-chip.is-active {
  background: var(--accent-ink);
  color: #fff;
}

.pager-size-chip:focus-visible {
  outline: 2px solid rgba(17, 17, 17, 0.18);
  outline-offset: 1px;
}
</style>
