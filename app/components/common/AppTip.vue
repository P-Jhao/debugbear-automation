<script setup lang="ts">
const props = withDefaults(defineProps<{
  content: string
  maxWidth?: number
}>(), {
  maxWidth: 320
})
</script>

<template>
  <span class="app-tip" :style="{ '--app-tip-max-width': `${props.maxWidth}px` }">
    <slot />
    <span class="app-tip__content" role="tooltip">{{ props.content }}</span>
  </span>
</template>

<style scoped>
.app-tip {
  position: relative;
  display: inline-flex;
  width: 100%;
  max-width: 100%;
  cursor: help;
}

.app-tip__content {
  position: absolute;
  z-index: 20;
  left: 0;
  bottom: calc(100% + 8px);
  display: block;
  width: max-content;
  max-width: min(var(--app-tip-max-width), 75vw);
  padding: 8px 10px;
  border-radius: 6px;
  background: #1f2937;
  color: #ffffff;
  font-size: 12px;
  line-height: 1.45;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.28);
  word-break: break-word;
  white-space: normal;
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px);
  transition: opacity 0.16s ease, transform 0.16s ease, visibility 0.16s ease;
  pointer-events: none;
}

.app-tip__content::after {
  content: '';
  position: absolute;
  left: 12px;
  top: 100%;
  border-width: 5px;
  border-style: solid;
  border-color: #1f2937 transparent transparent transparent;
}

.app-tip:hover .app-tip__content,
.app-tip:focus-within .app-tip__content {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
</style>
