<template>
  <button
    :class="[
      'ck-button',
      { 'ck-on': isActive, 'ck-button_with-text': hasText },
    ]"
    :title="title"
    :disabled="disabled"
    @mousedown.prevent="$emit('execute')">
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { computed, useSlots } from "vue";

const props = defineProps<{
  isActive?: boolean;
  title?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  execute: [];
}>();

const slots = useSlots();
const hasText = computed(() => {
  return slots
    .default?.()
    .some(
      (vnode) =>
        typeof vnode.children === "string" && vnode.children.trim().length > 0
    );
});
</script>

<style scoped>
.ck-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  min-width: 32px;
  height: 32px;
  color: inherit;
  font-size: inherit;
}

.ck-button:hover:not(:disabled) {
  background: hsl(0, 0%, 96%);
}

.ck-button.ck-on {
  background: var(--ck-color-focus-border, hsl(208, 88%, 52%));
  color: #fff;
  border-color: transparent;
}

.ck-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ck-button_with-text {
  padding: 6px 10px;
  font-size: 13px;
  min-width: auto;
}
</style>
