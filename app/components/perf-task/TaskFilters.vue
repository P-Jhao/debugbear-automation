<script setup lang="ts">
import type { PerfTaskFilters, PerfTaskStatus } from '~/shared/types/perfTask'

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
const isUrlDropdownOpen = ref(false)
const isVersionDropdownOpen = ref(false)
const urlComboboxRef = ref<HTMLElement | null>(null)
const versionComboboxRef = ref<HTMLElement | null>(null)

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
  isUrlDropdownOpen.value = false
  isVersionDropdownOpen.value = false
  onSearch()
}

const filteredUrlOptions = computed(() => {
  const keyword = filters.url.trim().toLowerCase()
  if (!keyword) {
    return props.urls.slice(0, 20)
  }
  return props.urls.filter((item) => item.toLowerCase().includes(keyword)).slice(0, 20)
})

const onSelectUrlOption = (url: string) => {
  filters.url = url
  isUrlDropdownOpen.value = false
}

const onUrlInputClick = () => {
  isUrlDropdownOpen.value = true
}

const filteredVersionOptions = computed(() => {
  const keyword = filters.version.trim().toLowerCase()
  if (!keyword) {
    return props.versions.slice(0, 20)
  }
  return props.versions.filter((item) => item.toLowerCase().includes(keyword)).slice(0, 20)
})

const onVersionInputClick = () => {
  isVersionDropdownOpen.value = true
}

const onSelectVersionOption = (version: string) => {
  filters.version = version
  isVersionDropdownOpen.value = false
  onVersionChange()
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof Node)) {
    return
  }
  if (urlComboboxRef.value && !urlComboboxRef.value.contains(target)) {
    isUrlDropdownOpen.value = false
  }
  if (versionComboboxRef.value && !versionComboboxRef.value.contains(target)) {
    isVersionDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
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
        <div ref="urlComboboxRef" class="url-combobox">
          <input
            id="f-url"
            v-model="filters.url"
            type="text"
            placeholder="example.com"
            autocomplete="off"
            @click="onUrlInputClick"
          />
          <ul
            v-if="isUrlDropdownOpen && filteredUrlOptions.length > 0"
            class="url-options"
            role="listbox"
          >
            <li v-for="item in filteredUrlOptions" :key="item">
              <button type="button" @mousedown.prevent="onSelectUrlOption(item)">
                {{ item }}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="form-field">
        <label for="f-status">状态</label>
        <select id="f-status" v-model="filters.status">
          <option v-for="item in statuses" :key="item.label" :value="item.value">{{ item.label }}</option>
        </select>
      </div>

      <div class="form-field">
        <label for="f-version">版本</label>
        <div ref="versionComboboxRef" class="url-combobox">
          <input
            id="f-version"
            v-model="filters.version"
            type="text"
            placeholder="全部版本"
            autocomplete="off"
            @click="onVersionInputClick"
            @input="onVersionChange"
          />
          <ul
            v-if="isVersionDropdownOpen && filteredVersionOptions.length > 0"
            class="url-options"
            role="listbox"
          >
            <li v-for="item in filteredVersionOptions" :key="item">
              <button type="button" @mousedown.prevent="onSelectVersionOption(item)">
                {{ item }}
              </button>
            </li>
          </ul>
        </div>
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

<style scoped>
.url-combobox {
  position: relative;
}

.url-options {
  position: absolute;
  z-index: 10;
  width: 100%;
  margin: 6px 0 0;
  padding: 4px;
  list-style: none;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  max-height: 220px;
  overflow-y: auto;
}

.url-options button {
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  padding: 8px 10px;
  cursor: pointer;
  color: #111827;
}

.url-options button:hover {
  background: #f3f4f6;
}
</style>
