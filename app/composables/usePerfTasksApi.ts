import type {
  CreatePerfTaskRequest,
  PerfTaskDetailResponse,
  PerfTaskFilters,
  PerfTaskListResponse
} from '~/shared/types/perfTask'

export const usePerfTasksApi = () => {
  const createTask = (payload: CreatePerfTaskRequest) =>
    $fetch<{ taskId: string; taskIds: string[] }>('/api/perf-tasks', {
      method: 'POST',
      body: payload
    })

  const listTasks = (filters: PerfTaskFilters) =>
    $fetch<PerfTaskListResponse>('/api/perf-tasks', {
      query: filters
    })

  const getTaskDetail = (taskId: string) =>
    $fetch<PerfTaskDetailResponse>(`/api/perf-tasks/${taskId}`)

  const deleteTask = (taskId: string) =>
    $fetch<{ success: true }>(`/api/perf-tasks/${taskId}`, {
      method: 'DELETE'
    })

  const stopTask = (taskId: string) =>
    $fetch<{ success: true }>(`/api/perf-tasks/${taskId}/cancel`, {
      method: 'POST'
    })

  const listVersions = () =>
    $fetch<{ items: string[] }>('/api/versions')

  const listGroups = (version?: string) =>
    version
      ? $fetch<{ items: string[] }>(`/api/versions/${encodeURIComponent(version)}/groups`)
      : $fetch<{ items: string[] }>('/api/versions/groups')

  return {
    createTask,
    listTasks,
    getTaskDetail,
    deleteTask,
    stopTask,
    listVersions,
    listGroups
  }
}
