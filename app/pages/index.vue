<script setup lang="ts">
import type { CreatePerfTaskRequest } from '~/shared/types/perfTask'

const store = usePerfTasksStore()
const router = useRouter()
const errorText = ref<string | null>(null)

const handleCreateTask = async (payload: CreatePerfTaskRequest) => {
  errorText.value = null
  try {
    const taskId = await store.createTask(payload)
    await router.push(`/tasks/${taskId}`)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '创建任务失败'
  }
}
</script>

<template>
  <div class="page-stack">
    <TaskCreateForm :loading="store.loading" @submit="handleCreateTask" />
    <p v-if="errorText" class="error-text">{{ errorText }}</p>
  </div>
</template>
