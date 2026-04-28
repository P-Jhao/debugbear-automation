<script setup lang="ts">
import type { PerfTaskFilters } from '~/shared/types/perfTask'

const store = usePerfTasksStore()
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_STORAGE_KEY = 'perf_tasks_page_size'
const allowedPageSizes = new Set([5, 10, 20])
const activeFilters = ref<PerfTaskFilters>({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE
})

const loadData = async () => {
  await store.fetchVersions()
  await store.fetchGroups()
  await store.fetchTasks(activeFilters.value)
}

const onSearch = async (filters: PerfTaskFilters) => {
  activeFilters.value = {
    ...filters,
    page: 1,
    pageSize: activeFilters.value.pageSize ?? DEFAULT_PAGE_SIZE
  }
  await store.fetchTasks(activeFilters.value)
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
}

const onDeleteTask = async (taskId: string) => {
  if (!window.confirm('确认删除这个历史任务吗？删除后不可恢复。')) {
    return
  }
  await store.deleteTask(taskId)
  await store.fetchTasks(activeFilters.value)
}

const onPageChange = async (nextPage: number) => {
  activeFilters.value = {
    ...activeFilters.value,
    page: nextPage,
    pageSize: activeFilters.value.pageSize ?? DEFAULT_PAGE_SIZE
  }
  await store.fetchTasks(activeFilters.value)
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
})

await loadData()
</script>

<template>
  <div class="page-stack">
    <TaskFilters
      :versions="store.versions"
      :groups="store.groups"
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
