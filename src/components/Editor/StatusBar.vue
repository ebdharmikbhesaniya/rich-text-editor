<template>
  <div
    class="status-bar flex justify-between items-center px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
    <div class="word-count flex items-center gap-4">
      <span>Words: {{ editorStore.wordCount }}</span>
      <span>Characters: {{ editorStore.characterCount }}</span>
    </div>
    <div
      v-if="showResizeHandle"
      class="resize-handle w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
      @mousedown="startResize"
      title="Resize editor">
      <svg viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
        <path
          d="M16 0v16H0V0h16zM1 1v14h14V1H1zm13 13L8 8v6h6zm-6-6L2 2v6h6z" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from "@/stores/editorStore";

interface Props {
  showResizeHandle?: boolean;
}

withDefaults(defineProps<Props>(), {
  showResizeHandle: true,
});

const editorStore = useEditorStore();

const startResize = (e: MouseEvent) => {
  e.preventDefault();
  const startY = e.clientY;
  const startHeight = editorStore.editorElement?.offsetHeight || 0;

  const onMouseMove = (ev: MouseEvent) => {
    const newHeight = startHeight + (ev.clientY - startY);
    if (editorStore.editorElement) {
      editorStore.editorElement.style.minHeight = `${Math.max(
        160,
        newHeight
      )}px`;
    }
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};
</script>
