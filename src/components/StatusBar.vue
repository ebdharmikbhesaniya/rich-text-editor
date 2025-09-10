<template>
  <div class="ck-editor__bottom-bar">
    <div class="ck-word-count">
      <span class="ck-word-count__words">Words: {{ wordCount }}</span>
      <span class="ck-word-count__characters">Chars: {{ characterCount }}</span>
    </div>
    <div
      class="ck-editor__resize-handle"
      @mousedown="handleResizeStart"
      title="Drag to resize editor"></div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  wordCount: number;
  characterCount: number;
}>();

const emit = defineEmits<{
  startResize: [event: MouseEvent];
}>();

const handleResizeStart = (event: MouseEvent) => {
  emit("startResize", event);
};
</script>

<style scoped>
.ck-editor__bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: hsl(0, 0%, 98%);
  border-top: 1px solid hsl(0, 0%, 92%);
  font-size: 12px;
  color: hsl(0, 0%, 50%);
}

.ck-word-count {
  display: flex;
  gap: 12px;
}

.ck-editor__resize-handle {
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, transparent 50%, hsl(0, 0%, 70%) 50%);
  cursor: nwse-resize;
  border-radius: 0 0 6px 0;
}

.ck-editor__resize-handle:hover {
  background: linear-gradient(135deg, transparent 50%, hsl(0, 0%, 50%) 50%);
}
</style>
