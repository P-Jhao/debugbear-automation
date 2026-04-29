<script setup lang="ts">
import type { CreatePerfTaskRequest } from '~/shared/types/perfTask'
import FilterCombobox from './FilterCombobox.vue'

const props = defineProps<{
  loading?: boolean
  urlOptions: string[]
  versionOptions: string[]
  groupOptions: string[]
}>()

const emit = defineEmits<{
  submit: [payload: CreatePerfTaskRequest]
}>()

const DEFAULT_TEST_COUNT = 12
const TEST_COUNT_STORAGE_KEY = 'perf_task_test_count'
const MIN_TEST_COUNT = 3
const MAX_TEST_COUNT = 30

const form = reactive<CreatePerfTaskRequest>({
  url: '',
  count: DEFAULT_TEST_COUNT,
  version: '',
  group: ''
})

const deviceSelection = reactive<Record<'mobile' | 'desktop', boolean>>({
  mobile: true,
  desktop: true
})

const selectedDevices = computed<Array<'mobile' | 'desktop'>>(() =>
  (Object.entries(deviceSelection) as Array<['mobile' | 'desktop', boolean]>)
    .filter(([, checked]) => checked)
    .map(([device]) => device)
)

const validationError = ref<string | null>(null)
const urlKeyword = ref('')
const versionKeyword = ref('')
const groupKeyword = ref('')

const urlComboboxOptions = computed(() => props.urlOptions.map((item) => ({ label: item, value: item })))
const versionComboboxOptions = computed(() =>
  props.versionOptions.map((item) => ({ label: item, value: item }))
)
const groupComboboxOptions = computed(() => props.groupOptions.map((item) => ({ label: item, value: item })))

watch(urlKeyword, (value) => {
  form.url = value
})

watch(versionKeyword, (value) => {
  form.version = value
})

watch(groupKeyword, (value) => {
  form.group = value
})

watch(
  () => form.count,
  (count) => {
    if (!Number.isInteger(count) || count < MIN_TEST_COUNT || count > MAX_TEST_COUNT) {
      return
    }
    localStorage.setItem(TEST_COUNT_STORAGE_KEY, String(count))
  }
)

onMounted(() => {
  const raw = localStorage.getItem(TEST_COUNT_STORAGE_KEY)
  if (!raw) {
    return
  }
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isInteger(parsed) || parsed < MIN_TEST_COUNT || parsed > MAX_TEST_COUNT) {
    return
  }
  form.count = parsed
  urlKeyword.value = form.url
  versionKeyword.value = form.version
  groupKeyword.value = form.group
})

const submitForm = () => {
  validationError.value = null

  if (!/^https?:\/\/.+/.test(form.url)) {
    validationError.value = '请输入合法的 HTTP/HTTPS 地址'
    return
  }
  if (form.count < MIN_TEST_COUNT || form.count > MAX_TEST_COUNT) {
    validationError.value = `测试次数需要在 ${MIN_TEST_COUNT} 到 ${MAX_TEST_COUNT} 之间`
    return
  }
  if (!form.version.trim() || !form.group.trim()) {
    validationError.value = '版本和分组不能为空'
    return
  }
  if (selectedDevices.value.length === 0) {
    validationError.value = '请至少选择一个测试设备'
    return
  }

  const devices = selectedDevices.value

  emit('submit', {
    url: form.url.trim(),
    count: form.count,
    version: form.version.trim(),
    group: form.group.trim(),
    config: {
      devices,
      ...(devices.length === 1 ? { device: devices[0] } : {})
    }
  })
}
</script>

<template>
  <section class="surface-card surface-section">
    <div>
      <h2 class="section-title">创建批量任务</h2>
      <p class="section-subtitle">输入 URL、次数、版本和分组后，系统会自动执行并实时展示进度。</p>
    </div>

    <form class="form-grid" @submit.prevent="submitForm">
      <div class="form-field" style="grid-column: 1 / -1">
        <label for="task-url">目标 URL</label>
        <FilterCombobox
          input-id="task-url"
          v-model="urlKeyword"
          :options="urlComboboxOptions"
          placeholder="https://example.com"
        />
      </div>

      <div class="form-field">
        <label for="task-count">测试次数</label>
        <input id="task-count" v-model.number="form.count" type="number" min="3" max="30" required />
      </div>

      <div class="form-field">
        <label for="task-version">版本</label>
        <FilterCombobox
          input-id="task-version"
          v-model="versionKeyword"
          :options="versionComboboxOptions"
          placeholder="v1.0.0"
        />
      </div>

      <div class="form-field">
        <label for="task-group">分组</label>
        <FilterCombobox
          input-id="task-group"
          v-model="groupKeyword"
          :options="groupComboboxOptions"
          placeholder="homepage"
        />
      </div>

      <div class="form-field" style="grid-column: 1 / -1">
        <label>测试设备</label>
        <div class="device-options">
          <label class="device-option">
            <input v-model="deviceSelection.mobile" type="checkbox" />
            <span>Mobile</span>
          </label>
          <label class="device-option">
            <input v-model="deviceSelection.desktop" type="checkbox" />
            <span>Desktop</span>
          </label>
        </div>
      </div>

      <div class="row-inline" style="grid-column: 1 / -1; justify-content: space-between">
        <p v-if="validationError" class="error-text">{{ validationError }}</p>
        <button class="button-primary" :disabled="props.loading" type="submit">
          {{ props.loading ? '创建中...' : '开始测试' }}
        </button>
      </div>
    </form>
  </section>
</template>
