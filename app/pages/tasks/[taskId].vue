<script setup lang="ts">
import type { PerfTaskStatus } from '~/shared/types/perfTask'

const route = useRoute()
const store = usePerfTasksStore()
const runtimeConfig = useRuntimeConfig()

const taskId = computed(() => String(route.params.taskId || ''))
const pollInterval = computed(() => {
  const value = Number(runtimeConfig.public.perfTaskPollIntervalMs)
  if (!Number.isFinite(value) || value <= 0) {
    return 3000
  }
  return value
})

let timer: ReturnType<typeof setInterval> | null = null

const statusLabelMap: Record<PerfTaskStatus, string> = {
  pending: '待执行',
  running: '执行中',
  cancelled: '已中止',
  completed: '已完成',
  partial_failed: '部分失败',
  failed: '失败'
}

const canStopTask = computed(() => {
  const status = store.currentTask?.status
  return status === 'pending' || status === 'running'
})

const stopPolling = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const loadDetail = async () => {
  await store.fetchTaskDetail(taskId.value)
}

const startPolling = () => {
  stopPolling()
  timer = setInterval(async () => {
    await loadDetail()
    if (store.isTerminalTask) {
      stopPolling()
    }
  }, pollInterval.value)
}

const handleStopTask = async () => {
  if (!store.currentTask) {
    return
  }

  if (!window.confirm('确认停止这个任务吗？当前已提交的请求可能会在本轮结束后停止。')) {
    return
  }

  await store.stopTask(store.currentTask.taskId)
  await loadDetail()
  stopPolling()
}

await loadDetail()
if (!store.isTerminalTask) {
  startPolling()
}

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <div class="page-stack">
    <section class="surface-card surface-section">
      <h1 class="section-title">任务详情</h1>
      <div v-if="store.currentTask" class="surface-section">
        <div class="row-inline">
          <span class="status-badge" :class="`status-${store.currentTask.status}`">
            {{ statusLabelMap[store.currentTask.status] }}
          </span>
          <span class="text-muted">进度 {{ store.currentTask.progressCount }} / {{ store.currentTask.count }}</span>
          <button
            v-if="canStopTask"
            class="table-action-button table-action-stop"
            type="button"
            :disabled="store.loading"
            @click="handleStopTask"
          >
            停止任务
          </button>
        </div>
        <div class="text-muted">URL: {{ store.currentTask.url }}</div>
        <div class="text-muted">
          版本: {{ store.currentTask.version }} | 分组: {{ store.currentTask.group }}
        </div>
        <p v-if="store.currentTask.errorMessage" class="error-text">
          失败原因：{{ store.currentTask.errorMessage }}
        </p>
      </div>
    </section>

    <TaskSummaryCards :summary="store.currentTask?.summary || null" />
    <TaskRunTable :runs="store.currentTask?.runs || []" />
    <p v-if="store.errorMessage" class="error-text">{{ store.errorMessage }}</p>
  </div>
</template>
