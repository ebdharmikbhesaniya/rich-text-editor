<template>
  <div
    class="ck-balloon-panel ck-toolbar ck-toolbar_floating"
    v-show="visible"
    :style="style"
    ref="contextMenu">
    <tool-button
      :isActive="isActive('bold')"
      title="Bold"
      @execute="$emit('execCommand', 'bold')">
      <i class="fa fa-bold" aria-hidden="true"></i>
    </tool-button>

    <tool-button
      :isActive="isActive('italic')"
      title="Italic"
      @execute="$emit('execCommand', 'italic')">
      <i class="fa fa-italic" aria-hidden="true"></i>
    </tool-button>

    <tool-button title="Link" @execute="$emit('insertLink')">
      <i class="fa fa-link" aria-hidden="true"></i>
    </tool-button>

    <tool-button
      title="Highlight"
      @execute="$emit('applyHighlight', currentHighlightColor)">
      <i class="fa fa-highlighter" aria-hidden="true"></i>
    </tool-button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import ToolButton from "./Toolbar/ToolButton.vue";

defineProps<{
  visible: boolean;
  style: Record<string, string>;
  currentHighlightColor: string;
  isActive: (command: string) => boolean;
}>();

defineEmits<{
  execCommand: [command: string];
  insertLink: [];
  applyHighlight: [color: string];
}>();

const contextMenu = ref<HTMLElement>();

defineExpose({
  contextMenu,
});
</script>

<style scoped>
.ck-toolbar_floating {
  position: fixed;
  background: #fff;
  border: 1px solid hsl(0, 0%, 92%);
  border-radius: 6px;
  padding: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  z-index: 99999;
  display: flex;
  gap: 6px;
}

.ck-balloon-panel {
  position: absolute;
  border-radius: 6px;
}
</style>
