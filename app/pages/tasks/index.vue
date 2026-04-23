<script setup lang="ts">
import type { PerfTaskFilters } from '~/shared/types/perfTask'

const store = usePerfTasksStore()
const activeFilters = ref<PerfTaskFilters>({})

const loadData = async () => {
  await store.fetchVersions()
  await store.fetchTasks(activeFilters.value)
}

const onSearch = async (filters: PerfTaskFilters) => {
  activeFilters.value = filters
  await store.fetchTasks(filters)
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
    <TaskListTable :items="store.tasks" @stop="onStopTask" @delete="onDeleteTask" />
    <p v-if="store.errorMessage" class="error-text">{{ store.errorMessage }}</p>
  </div>
</template>
