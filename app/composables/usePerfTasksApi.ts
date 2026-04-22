import type {
  CreatePerfTaskRequest,
  PerfTaskDetailResponse,
  PerfTaskFilters,
  PerfTaskListResponse
} from '~/shared/types/perfTask'

export const usePerfTasksApi = () => {
  const createTask = (payload: CreatePerfTaskRequest) =>
    $fetch<{ taskId: string }>('/api/perf-tasks', {
      method: 'POST',
      body: payload
    })

  const listTasks = (filters: PerfTaskFilters) =>
    $fetch<PerfTaskListResponse>('/api/perf-tasks', {
      query: filters
    })

  const getTaskDetail = (taskId: string) =>
    $fetch<PerfTaskDetailResponse>(`/api/perf-tasks/${taskId}`)

  const listVersions = () =>
    $fetch<{ items: string[] }>('/api/versions')

  const listGroups = (version: string) =>
    $fetch<{ items: string[] }>(`/api/versions/${encodeURIComponent(version)}/groups`)

  return {
    createTask,
    listTasks,
    getTaskDetail,
    listVersions,
    listGroups
  }
}
