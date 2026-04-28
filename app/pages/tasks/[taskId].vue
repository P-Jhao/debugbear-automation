<script setup lang="ts">
import type { PerfTaskDevice, PerfTaskStatus } from '~/shared/types/perfTask'

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

const deviceLabelMap: Record<PerfTaskDevice, string> = {
  mobile: 'Mobile',
  desktop: 'Desktop',
  unknown: '-'
}

const canStopTask = computed(() => {
  const status = store.currentTask?.status
  return status === 'pending' || status === 'running'
})

const stripUrlQuery = (url: string | null | undefined) => {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return null
  }
}

const taskOverviewUrl = computed(() => {
  const normalizedOverview = stripUrlQuery(store.currentTask?.debugBearOverviewUrl)
  if (normalizedOverview) {
    return normalizedOverview
  }

  const firstRunUrl = store.currentTask?.runs.find((run) => Boolean(run.debugBearUrl))?.debugBearUrl
  return stripUrlQuery(firstRunUrl)
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
                  <div class="task-detail-header">
        <h1 class="section-title">任务详情</h1>
        <a
          v-if="taskOverviewUrl"
          class="task-overview-button"
          :href="taskOverviewUrl"
          target="_blank"
          rel="noreferrer"
        >
          查看总详情
        </a>
      </div>
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
          版本: {{ store.currentTask.version }} | 分组: {{ store.currentTask.group }} | 设备:
          {{ deviceLabelMap[store.currentTask.device] }}
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

<style scoped>
.task-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-overview-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 14px;
  border: 1px solid #d8d9dc;
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f6f8 100%);
  color: #111111;
  font-size: 0.86rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 120ms ease;
}

.task-overview-button:hover {
  border-color: #bfc2c7;
  background: linear-gradient(180deg, #ffffff 0%, #eef1f4 100%);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.task-overview-button:active {
  transform: translateY(1px);
}

.task-overview-button:focus-visible {
  outline: 2px solid rgba(17, 17, 17, 0.22);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .task-detail-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
