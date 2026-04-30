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
const envError = ref<string | null>(null)
const envSuccess = ref<string | null>(null)
const urlKeyword = ref('')
const versionKeyword = ref('')
const groupKeyword = ref('')
const showEnvModal = ref(false)
const envLoading = ref(false)
const envSaving = ref(false)
const isClientMounted = ref(false)
const envForm = reactive({
  apiKey: '',
  projectId: ''
})

type DesktopEnvBridge = {
  isDesktop: boolean
  getDebugBearConfig: () => Promise<{ apiKey: string; projectId: string }>
  setDebugBearConfig: (payload: { apiKey: string; projectId: string }) => Promise<{ ok: boolean }>
}

const desktopEnvBridge = computed<DesktopEnvBridge | null>(() => {
  if (typeof window === 'undefined') {
    return null
  }
  return (window as Window & { desktopEnv?: DesktopEnvBridge }).desktopEnv ?? null
})

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') {
    return false
  }
  return navigator.userAgent.includes('Electron')
})

const isDesktopApp = computed(() => isElectronRuntime.value && desktopEnvBridge.value?.isDesktop === true)
const shouldShowDesktopConfigButton = computed(() => isClientMounted.value && isDesktopApp.value)

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
  isClientMounted.value = true
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

const openEnvModal = async () => {
  if (!isDesktopApp.value) {
    return
  }
  if (!desktopEnvBridge.value) {
    envError.value = '桌面桥接未就绪，请重启应用；若仍失败请联系开发排查 preload 注入。'
    envSuccess.value = null
    showEnvModal.value = true
    return
  }
  envError.value = null
  envSuccess.value = null
  envLoading.value = true
  showEnvModal.value = true
  try {
    const envData = await desktopEnvBridge.value.getDebugBearConfig()
    envForm.apiKey = envData.apiKey ?? ''
    envForm.projectId = envData.projectId ?? ''
  } catch (error) {
    envError.value = error instanceof Error ? error.message : '读取配置失败'
  } finally {
    envLoading.value = false
  }
}

const closeEnvModal = () => {
  if (envSaving.value) {
    return
  }
  showEnvModal.value = false
}

const saveEnvConfig = async () => {
  if (!desktopEnvBridge.value) {
    return
  }
  envError.value = null
  envSuccess.value = null
  const apiKey = envForm.apiKey.trim()
  const projectId = envForm.projectId.trim()
  if (!apiKey) {
    envError.value = 'API Key 不能为空'
    return
  }
  if (!/^\d+$/.test(projectId)) {
    envError.value = 'Project ID 必须为正整数'
    return
  }
  envSaving.value = true
  try {
    await desktopEnvBridge.value.setDebugBearConfig({ apiKey, projectId })
    envSuccess.value = '保存成功，重启桌面应用后生效。'
  } catch (error) {
    envError.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    envSaving.value = false
  }
}
</script>

<template>
  <section class="surface-card surface-section">
    <div class="section-title-row">
      <h2 class="section-title">创建批量任务</h2>
      <button
        v-if="shouldShowDesktopConfigButton"
        class="button-secondary env-button"
        type="button"
        @click="openEnvModal"
      >
        API 配置
      </button>
    </div>
    <div>
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

    <div v-if="showEnvModal" class="env-modal-mask" @click.self="closeEnvModal">
      <section class="env-modal surface-card">
        <div class="env-modal-header">
          <h3>桌面端 API 配置</h3>
          <button class="button-secondary" type="button" :disabled="envSaving" @click="closeEnvModal">
            关闭
          </button>
        </div>
        <p class="section-subtitle">用于填写 DebugBear 接口凭证（API Key）和项目 ID。</p>

        <div class="form-field">
          <label for="env-api-key">API Key</label>
          <input id="env-api-key" v-model.trim="envForm.apiKey" type="text" autocomplete="off" />
        </div>

        <div class="form-field">
          <label for="env-project-id">Project ID</label>
          <input id="env-project-id" v-model.trim="envForm.projectId" type="text" inputmode="numeric" />
        </div>

        <p class="section-subtitle">保存后需要重启桌面应用，服务端配置才会生效。</p>
        <p v-if="envLoading" class="text-muted">正在读取当前配置...</p>
        <p v-if="envError" class="error-text">{{ envError }}</p>
        <p v-if="envSuccess" class="success-text">{{ envSuccess }}</p>

        <div class="row-inline env-modal-actions">
          <button class="button-primary" type="button" :disabled="envSaving || envLoading" @click="saveEnvConfig">
            {{ envSaving ? '保存中...' : '保存配置' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.env-button {
  white-space: nowrap;
}

.env-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(17, 17, 17, 0.44);
  display: grid;
  place-items: center;
  padding: 20px;
}

.env-modal {
  width: min(540px, 100%);
  display: grid;
  gap: 12px;
}

.env-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.env-modal-header h3 {
  margin: 0;
  font-size: 1.08rem;
}

.env-modal-actions {
  justify-content: flex-end;
}

.success-text {
  margin: 0;
  color: var(--status-success-text);
}

@media (max-width: 768px) {
  .section-title-row {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .env-modal-mask {
    padding: 12px;
  }
}
</style>
