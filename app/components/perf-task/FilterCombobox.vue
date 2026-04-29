<script setup lang="ts">
interface ComboboxOption {
  label: string
  value: string
}
import closeIcon from '~/assets/icons/close_small.svg'

const props = withDefaults(
  defineProps<{
    inputId?: string
    modelValue: string
    options: ComboboxOption[]
    placeholder?: string
    maxVisible?: number
  }>(),
  {
    placeholder: '',
    maxVisible: 20
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [option: ComboboxOption]
}>()

const rootRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

const filteredOptions = computed(() => {
  const keyword = props.modelValue.trim().toLowerCase()
  const source = keyword
    ? props.options.filter((item) => item.label.toLowerCase().includes(keyword))
    : props.options
  return source.slice(0, props.maxVisible)
})

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const onInputClick = () => {
  isOpen.value = true
}

const onClear = () => {
  emit('update:modelValue', '')
  isOpen.value = true
}

const onSelect = (option: ComboboxOption) => {
  emit('update:modelValue', option.label)
  emit('select', option)
  isOpen.value = false
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof Node)) {
    return
  }
  if (rootRef.value && !rootRef.value.contains(target)) {
    isOpen.value = false
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
  <div ref="rootRef" class="filter-combobox">
    <input :id="inputId" :value="modelValue" type="text" class="filter-combobox-input" :placeholder="placeholder"
      autocomplete="off" @click="onInputClick" @input="onInput" />
    <button v-if="modelValue" type="button" class="filter-combobox-clear" aria-label="清空输入" @mousedown.prevent
      @click="onClear">
      <img :src="closeIcon" alt="" />
    </button>
    <ul v-if="isOpen && filteredOptions.length > 0" class="filter-combobox-options" role="listbox">
      <li v-for="item in filteredOptions" :key="item.value">
        <button type="button" @mousedown.prevent="onSelect(item)">
          {{ item.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.filter-combobox {
  position: relative;
}

.filter-combobox-input {
  padding-right: 28px;
}

.filter-combobox-clear {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  border: 0;
  border-radius: 999px;
  width: 18px;
  height: 18px;
  line-height: 18px;
  padding: 0;
  text-align: center;
  cursor: pointer;
  background: #e5e7eb;
  color: #374151;
}

.filter-combobox-clear:hover {
  background: #d1d5db;
}

.filter-combobox-clear img {
  width: 12px;
  height: 12px;
  display: block;
  margin: 0 auto;
}

.filter-combobox-options {
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

.filter-combobox-options button {
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  padding: 8px 10px;
  cursor: pointer;
  color: #111827;
}

.filter-combobox-options button:hover {
  background: #f3f4f6;
}
</style>
