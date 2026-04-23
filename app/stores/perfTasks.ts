import { defineStore } from 'pinia'
import type {
  CreatePerfTaskRequest,
  PerfTaskDetailResponse,
  PerfTaskFilters,
  PerfTaskListItem,
  PerfTaskStatus
} from '~/shared/types/perfTask'

const TERMINAL_STATUSES = new Set<PerfTaskStatus>(['cancelled', 'completed', 'partial_failed', 'failed'])

const getReadableError = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const maybe = error as {
      data?: { statusMessage?: string; message?: string }
      statusMessage?: string
      message?: string
    }
    return (
      maybe.data?.statusMessage ??
      maybe.statusMessage ??
      maybe.data?.message ??
      maybe.message ??
      fallback
    )
  }

  return fallback
}

export const usePerfTasksStore = defineStore('perfTasks', () => {
  const api = usePerfTasksApi()
  const tasks = ref<PerfTaskListItem[]>([])
  const currentTask = ref<PerfTaskDetailResponse | null>(null)
  const versions = ref<string[]>([])
  const groups = ref<string[]>([])
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const fetchTasks = async (filters: PerfTaskFilters = {}) => {
    loading.value = true
    errorMessage.value = null
    try {
      const data = await api.listTasks(filters)
      tasks.value = data.items
      return data.items
    } catch (error) {
      errorMessage.value = getReadableError(error, '鍔犺浇浠诲姟鍒楄〃澶辫触')
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchTaskDetail = async (taskId: string) => {
    loading.value = true
    errorMessage.value = null
    try {
      const data = await api.getTaskDetail(taskId)
      currentTask.value = data
      return data
    } catch (error) {
      errorMessage.value = getReadableError(error, '鍔犺浇浠诲姟璇︽儏澶辫触')
      throw error
    } finally {
      loading.value = false
    }
  }

  const createTask = async (payload: CreatePerfTaskRequest) => {
    loading.value = true
    errorMessage.value = null
    try {
      const data = await api.createTask(payload)
      return data.taskId
    } catch (error) {
      errorMessage.value = getReadableError(error, '鍒涘缓浠诲姟澶辫触')
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (taskId: string) => {
    loading.value = true
    errorMessage.value = null
    try {
      await api.deleteTask(taskId)
      tasks.value = tasks.value.filter((item) => item.taskId !== taskId)
      if (currentTask.value?.taskId === taskId) {
        currentTask.value = null
      }
    } catch (error) {
      errorMessage.value = getReadableError(error, '鍒犻櫎浠诲姟澶辫触')
      throw error
    } finally {
      loading.value = false
    }
  }

  const stopTask = async (taskId: string) => {
    loading.value = true
    errorMessage.value = null
    try {
      await api.stopTask(taskId)

      if (currentTask.value?.taskId === taskId) {
        currentTask.value = await api.getTaskDetail(taskId)
      }

      const listItem = tasks.value.find((item) => item.taskId === taskId)
      if (listItem) {
        listItem.status = 'cancelled'
        listItem.errorMessage = '任务已中止'
      }
    } catch (error) {
      errorMessage.value = getReadableError(error, '鍋滄浠诲姟澶辫触')
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchVersions = async () => {
    const data = await api.listVersions()
    versions.value = data.items
  }

  const fetchGroups = async (version: string) => {
    if (!version) {
      groups.value = []
      return
    }
    const data = await api.listGroups(version)
    groups.value = data.items
  }

  const isTerminalTask = computed(() => {
    if (!currentTask.value) {
      return false
    }
    return TERMINAL_STATUSES.has(currentTask.value.status)
  })

  return {
    tasks,
    currentTask,
    versions,
    groups,
    loading,
    errorMessage,
    isTerminalTask,
    fetchTasks,
    fetchTaskDetail,
    createTask,
    deleteTask,
    stopTask,
    fetchVersions,
    fetchGroups
  }
})

