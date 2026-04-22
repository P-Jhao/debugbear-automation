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
    <TaskListTable :items="store.tasks" />
    <p v-if="store.errorMessage" class="error-text">{{ store.errorMessage }}</p>
  </div>
</template>
