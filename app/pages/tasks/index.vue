<script setup lang="ts">
import type { PerfTaskFilters } from '~/shared/types/perfTask'

const store = usePerfTasksStore()
const api = usePerfTasksApi()
const runtimeConfig = useRuntimeConfig()
const DEFAULT_PAGE_SIZE = 10
const DEFAULT_POLL_INTERVAL_MS = 5000
const PAGE_SIZE_STORAGE_KEY = 'perf_tasks_page_size'
const allowedPageSizes = new Set([5, 10, 20])
const urlOptions = ref<string[]>([])
const activeFilters = ref<PerfTaskFilters>({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE
})
let pollTimer: ReturnType<typeof setTimeout> | null = null
let isPolling = false

const getPollIntervalMs = () => {
  const raw = Number(runtimeConfig.public.perfTaskPollIntervalMs)
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_POLL_INTERVAL_MS
  }
  return Math.floor(raw)
}

const hasActiveTasks = () => {
  return store.tasks.some(task => task.status === 'pending' || task.status === 'running')
}

const stopPolling = () => {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

const pollTasks = async () => {
  if (isPolling) {
    return
  }
  isPolling = true
  try {
    await store.fetchTasks(activeFilters.value)
  }
  finally {
    isPolling = false
  }

  if (!hasActiveTasks()) {
    stopPolling()
    return
  }

  pollTimer = setTimeout(() => {
    void pollTasks()
  }, getPollIntervalMs())
}

const updatePollingState = () => {
  if (!hasActiveTasks()) {
    stopPolling()
    return
  }
  if (pollTimer || isPolling) {
    return
  }
  pollTimer = setTimeout(() => {
    void pollTasks()
  }, getPollIntervalMs())
}

const loadData = async () => {
  const [versionsResult, groupsResult, tasksResult, urlsResult] = await Promise.all([
    store.fetchVersions(),
    store.fetchGroups(),
    store.fetchTasks(activeFilters.value),
    api.listUrls(undefined, 300)
  ])
  void versionsResult
  void groupsResult
  void tasksResult
  urlOptions.value = urlsResult.items
}

const onSearch = async (filters: PerfTaskFilters) => {
  activeFilters.value = {
    ...filters,
    page: 1,
    pageSize: activeFilters.value.pageSize ?? DEFAULT_PAGE_SIZE
  }
  await store.fetchTasks(activeFilters.value)
  updatePollingState()
}

const onVersionChange = async (version: string) => {
  await store.fetchGroups(version)
}

const onStopTask = async (taskId: string) => {
  if (!window.confirm('确认停止这个任务吗？当前已提交的请求可能会在本轮结束后停止。')) {
    return
  }
  await store.stopTask(taskId)
  await store.fetchTasks(activeFilters.value)
  updatePollingState()
}

const onDeleteTask = async (taskId: string) => {
  if (!window.confirm('确认删除这个历史任务吗？删除后不可恢复。')) {
    return
  }
  await store.deleteTask(taskId)
  await store.fetchTasks(activeFilters.value)
  updatePollingState()
}

const onPageChange = async (nextPage: number) => {
  activeFilters.value = {
    ...activeFilters.value,
    page: nextPage,
    pageSize: activeFilters.value.pageSize ?? DEFAULT_PAGE_SIZE
  }
  await store.fetchTasks(activeFilters.value)
  updatePollingState()
}

const onPageSizeChange = async (nextPageSize: number) => {
  if (!allowedPageSizes.has(nextPageSize)) {
    return
  }
  activeFilters.value = {
    ...activeFilters.value,
    page: 1,
    pageSize: nextPageSize
  }
  localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(nextPageSize))
  await store.fetchTasks(activeFilters.value)
  updatePollingState()
}

onMounted(async () => {
  const raw = localStorage.getItem(PAGE_SIZE_STORAGE_KEY)
  if (!raw) {
    return
  }
  const parsed = Number.parseInt(raw, 10)
  if (!allowedPageSizes.has(parsed) || parsed === activeFilters.value.pageSize) {
    return
  }
  activeFilters.value = {
    ...activeFilters.value,
    page: 1,
    pageSize: parsed
  }
  await store.fetchTasks(activeFilters.value)
  updatePollingState()
})

onUnmounted(() => {
  stopPolling()
})

await loadData()
updatePollingState()
</script>

<template>
  <div class="page-stack">
    <TaskFilters
      :versions="store.versions"
      :groups="store.groups"
      :urls="urlOptions"
      @search="onSearch"
      @version-change="onVersionChange"
    />
    <TaskListTable
      :items="store.tasks"
      :page="store.page"
      :page-size="store.pageSize"
      :total="store.total"
      :total-pages="store.totalPages"
      @stop="onStopTask"
      @delete="onDeleteTask"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
    />
    <p v-if="store.errorMessage" class="error-text">{{ store.errorMessage }}</p>
  </div>
</template>
