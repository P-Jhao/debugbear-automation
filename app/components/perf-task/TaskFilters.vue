<script setup lang="ts">
import type { PerfTaskFilters, PerfTaskStatus } from '~/shared/types/perfTask'
import FilterCombobox from './FilterCombobox.vue'
type ComboboxOption = { label: string; value: string }

const props = defineProps<{
  versions: string[]
  groups: string[]
  urls: string[]
}>()

const emit = defineEmits<{
  search: [filters: PerfTaskFilters]
  versionChange: [version: string]
}>()

type TaskFiltersForm = {
  urlKeyword: string
  statusKeyword: string
  versionKeyword: string
  groupKeyword: string
  deviceKeyword: string
  status: PerfTaskStatus | ''
  version: string
  group: string
  device: 'mobile' | 'desktop' | ''
}

const createDefaultFilters = (): TaskFiltersForm => ({
  urlKeyword: '',
  status: '',
  statusKeyword: '',
  versionKeyword: '',
  version: '',
  groupKeyword: '',
  group: '',
  device: '',
  deviceKeyword: ''
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
  filters.version = filters.versionKeyword.trim()
  filters.group = ''
  filters.groupKeyword = ''
  emit('versionChange', filters.version || '')
}

const onSearch = () => {
  emit('search', {
    url: filters.urlKeyword?.trim() || undefined,
    status: filters.status || undefined,
    version: filters.versionKeyword?.trim() || undefined,
    group: filters.groupKeyword?.trim() || undefined,
    device: filters.device || undefined
  })
}

const onReset = () => {
  Object.assign(filters, createDefaultFilters())
  emit('versionChange', '')
  onSearch()
}

const urlOptions = computed(() => props.urls.map((item) => ({ label: item, value: item })))
const versionOptions = computed(() => props.versions.map((item) => ({ label: item, value: item })))
const groupOptions = computed(() => props.groups.map((item) => ({ label: item, value: item })))
const statusOptions = computed(() => statuses.map((item) => ({ label: item.label, value: item.value })))
const deviceOptions: ComboboxOption[] = [
  { label: '全部设备', value: '' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Desktop', value: 'desktop' }
]

const onStatusInputChange = () => {
  filters.status = ''
}

const onDeviceInputChange = () => {
  filters.device = ''
}

const onStatusSelect = (option: ComboboxOption) => {
  filters.status = option.value as PerfTaskStatus | ''
  filters.statusKeyword = option.label
}

const onVersionInputChange = (value: string) => {
  filters.versionKeyword = value
  onVersionChange()
}

const onVersionSelect = (option: ComboboxOption) => {
  filters.versionKeyword = option.label
  filters.version = option.value
  onVersionChange()
}

const onGroupInputChange = (value: string) => {
  filters.groupKeyword = value
  filters.group = value.trim()
}

const onGroupSelect = (option: ComboboxOption) => {
  filters.groupKeyword = option.label
  filters.group = option.value
}

const onDeviceSelect = (option: ComboboxOption) => {
  filters.device = option.value as 'mobile' | 'desktop' | ''
  filters.deviceKeyword = option.label
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
        <FilterCombobox
          input-id="f-url"
          v-model="filters.urlKeyword"
          :options="urlOptions"
          placeholder="example.com"
        />
      </div>

      <div class="form-field">
        <label for="f-status">状态</label>
        <FilterCombobox
          input-id="f-status"
          v-model="filters.statusKeyword"
          :options="statusOptions"
          placeholder="全部状态"
          :max-visible="10"
          @update:model-value="onStatusInputChange"
          @select="onStatusSelect"
        />
      </div>

      <div class="form-field">
        <label for="f-version">版本</label>
        <FilterCombobox
          input-id="f-version"
          v-model="filters.versionKeyword"
          :options="versionOptions"
          placeholder="全部版本"
          @update:model-value="onVersionInputChange"
          @select="onVersionSelect"
        />
      </div>

      <div class="form-field">
        <label for="f-group">分组</label>
        <FilterCombobox
          input-id="f-group"
          v-model="filters.groupKeyword"
          :options="groupOptions"
          placeholder="全部分组"
          @update:model-value="onGroupInputChange"
          @select="onGroupSelect"
        />
      </div>

      <div class="form-field">
        <label for="f-device">设备</label>
        <FilterCombobox
          input-id="f-device"
          v-model="filters.deviceKeyword"
          :options="deviceOptions"
          placeholder="全部设备"
          :max-visible="10"
          @update:model-value="onDeviceInputChange"
          @select="onDeviceSelect"
        />
      </div>
    </div>
  </section>
</template>
