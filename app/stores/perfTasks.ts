import { defineStore } from 'pinia'
import type {
  CreatePerfTaskRequest,
  PerfTaskDetailResponse,
  PerfTaskFilters,
  PerfTaskListItem,
  PerfTaskStatus
} from '~/shared/types/perfTask'

const TERMINAL_STATUSES = new Set<PerfTaskStatus>(['completed', 'partial_failed', 'failed'])

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
      errorMessage.value = error instanceof Error ? error.message : '加载任务列表失败'
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
      errorMessage.value = error instanceof Error ? error.message : '加载任务详情失败'
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
      errorMessage.value = error instanceof Error ? error.message : '创建任务失败'
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
    fetchVersions,
    fetchGroups
  }
})
