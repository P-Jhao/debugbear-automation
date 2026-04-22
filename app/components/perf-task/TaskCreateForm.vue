<script setup lang="ts">
import type { CreatePerfTaskRequest } from '~/shared/types/perfTask'

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: CreatePerfTaskRequest]
}>()

const form = reactive<CreatePerfTaskRequest>({
  url: '',
  count: 12,
  version: '',
  group: ''
})

const validationError = ref<string | null>(null)

const submitForm = () => {
  validationError.value = null

  if (!/^https?:\/\/.+/.test(form.url)) {
    validationError.value = '请输入合法的 HTTP/HTTPS 地址'
    return
  }
  if (form.count < 3 || form.count > 30) {
    validationError.value = '测试次数需要在 3 到 30 之间'
    return
  }
  if (!form.version.trim() || !form.group.trim()) {
    validationError.value = '版本和分组不能为空'
    return
  }

  emit('submit', {
    url: form.url.trim(),
    count: form.count,
    version: form.version.trim(),
    group: form.group.trim()
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
        <input id="task-url" v-model="form.url" type="url" placeholder="https://example.com" required />
      </div>

      <div class="form-field">
        <label for="task-count">测试次数</label>
        <input id="task-count" v-model.number="form.count" type="number" min="3" max="30" required />
      </div>

      <div class="form-field">
        <label for="task-version">版本</label>
        <input id="task-version" v-model="form.version" type="text" placeholder="2026.04.22" required />
      </div>

      <div class="form-field">
        <label for="task-group">分组</label>
        <input id="task-group" v-model="form.group" type="text" placeholder="homepage" required />
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
