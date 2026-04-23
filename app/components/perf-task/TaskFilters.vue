<script setup lang="ts">
import type { PerfTaskFilters, PerfTaskStatus } from '~/shared/types/perfTask'

const props = defineProps<{
  versions: string[]
  groups: string[]
}>()

const emit = defineEmits<{
  search: [filters: PerfTaskFilters]
  versionChange: [version: string]
}>()

type TaskFiltersForm = {
  url: string
  status: PerfTaskStatus | ''
  version: string
  group: string
  device: 'mobile' | 'desktop' | ''
}

const createDefaultFilters = (): TaskFiltersForm => ({
  url: '',
  status: '',
  version: '',
  group: '',
  device: ''
})

const filters = reactive<TaskFiltersForm>(createDefaultFilters())

const statuses: Array<{ label: string; value: PerfTaskStatus | '' }> = [
  { label: '全部状态', value: '' },
  { label: '待执行', value: 'pending' },
  { label: '执行', value: 'running' },
  { label: '已中止', value: 'cancelled' },
  { label: '已完成', value: 'completed' },
  { label: '部分失败', value: 'partial_failed' },
  { label: '失败', value: 'failed' }
]

const onVersionChange = () => {
  filters.group = ''
  emit('versionChange', filters.version || '')
}

const onSearch = () => {
  emit('search', {
    url: filters.url?.trim() || undefined,
    status: filters.status || undefined,
    version: filters.version?.trim() || undefined,
    group: filters.group?.trim() || undefined,
    device: filters.device || undefined
  })
}

const onReset = () => {
  Object.assign(filters, createDefaultFilters())
  emit('versionChange', '')
  onSearch()
}
</script>

<template>
  <section class="surface-card surface-section">
    <div class="row-inline" style="justify-content: space-between">
      <h2 class="section-title">历史筛选</h2>
      <div class="row-inline">
        <button class="button-secondary" type="button" @click="onReset">重置</button>
        <button class="button-secondary" type="button" @click="onSearch">查询</button>
      </div>
    </div>

    <div class="form-grid">
      <div class="form-field">
        <label for="f-url">URL 关键字</label>
        <input id="f-url" v-model="filters.url" type="text" placeholder="example.com" />
      </div>

      <div class="form-field">
        <label for="f-status">状态</label>
        <select id="f-status" v-model="filters.status">
          <option v-for="item in statuses" :key="item.label" :value="item.value">{{ item.label }}</option>
        </select>
      </div>

      <div class="form-field">
        <label for="f-version">版本</label>
        <select id="f-version" v-model="filters.version" @change="onVersionChange">
          <option value="">全部版本</option>
          <option v-for="item in props.versions" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>

      <div class="form-field">
        <label for="f-group">分组</label>
        <select id="f-group" v-model="filters.group">
          <option value="">全部分组</option>
          <option v-for="item in props.groups" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>

      <div class="form-field">
        <label for="f-device">设备</label>
        <select id="f-device" v-model="filters.device">
          <option value="">全部设备</option>
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
        </select>
      </div>
    </div>
  </section>
</template>
