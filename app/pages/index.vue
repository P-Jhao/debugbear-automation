<script setup lang="ts">
import type { CreatePerfTaskRequest } from '~/shared/types/perfTask'

const store = usePerfTasksStore()
const api = usePerfTasksApi()
const router = useRouter()
const errorText = ref<string | null>(null)
const urlOptions = ref<string[]>([])
const versionOptions = ref<string[]>([])
const groupOptions = ref<string[]>([])

const loadCreateOptions = async () => {
  try {
    const [urlsData, versionsData, groupsData] = await Promise.all([
      api.listUrls(undefined, 300),
      api.listVersions(),
      api.listGroups()
    ])
    urlOptions.value = urlsData.items
    versionOptions.value = versionsData.items
    groupOptions.value = groupsData.items
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '初始化数据加载失败'
  }
}

const handleCreateTask = async (payload: CreatePerfTaskRequest) => {
  errorText.value = null
  try {
    const result = await store.createTask(payload)
    if (result.taskIds.length > 1) {
      await router.push('/tasks')
      return
    }
    await router.push(`/tasks/${result.taskId}`)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '创建任务失败'
  }
}

onMounted(() => {
  void loadCreateOptions()
})
</script>

<template>
  <div class="page-stack">
    <TaskCreateForm
      :loading="store.loading"
      :url-options="urlOptions"
      :version-options="versionOptions"
      :group-options="groupOptions"
      @submit="handleCreateTask"
    />
    <p v-if="errorText" class="error-text">{{ errorText }}</p>
  </div>
</template>
