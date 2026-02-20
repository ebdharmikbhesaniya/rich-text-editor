<template>
  <div
    ref="containerRef"
    class="rich-text-editor border border-gray-300 rounded-lg bg-white font-sans text-sm"
    :class="{ 'ring-2 ring-blue-500 ring-opacity-20': editorStore.isFocused }">
    <Toolbar v-if="showToolbar" />

    <EditorContent
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @update:model-value="$emit('update:modelValue', $event)"
      @change="$emit('change', $event)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)" />

    <StatusBar v-if="showStatusBar" />

    <ContextMenu />
  </div>
</template>

<script setup lang="ts">
import Toolbar from "@/components/Toolbar/Toolbar.vue";
import { useEditorStore } from "@/stores/editorStore";
import type { EditorProps, ToolName } from "@/types";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import ContextMenu from "./ContextMenu.vue";
import EditorContent from "./EditorContent.vue";
import StatusBar from "./StatusBar.vue";

interface Props extends EditorProps {
  showToolbar?: boolean;
  showStatusBar?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "test <b>what is this</b><p></p>",
  placeholder: "Start typing here...",
  tools: () =>
    [
      "undo",
      "redo",
      "heading",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "superscript",
      "subscript",
      "fontColor",
      "highlight",
      "table",
      "link",
      "horizontalRule",
      "bulletList",
      "numberedList",
      "alignLeft",
      "alignCenter",
      "alignRight",
      "alignJustify",
      "codeView",
      "taskList",
    ] as ToolName[],
  disabled: false,
  readonly: false,
  showToolbar: true,
  showStatusBar: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const containerRef = ref<HTMLElement>();
const editorStore = useEditorStore();

const showToolbar = computed(() => props.showToolbar && props.tools.length > 0);

onMounted(() => {
  // editorStore.setContent(props.modelValue)
  editorStore.setEnabledTools(props.tools);
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const handleClickOutside = (event: Event) => {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
    // Handle outside clicks
  }
};

watch(
  () => props.tools,
  (newTools) => {
    editorStore.setEnabledTools(newTools);
  },
  { immediate: true }
);
</script>

<style scoped>
.rich-text-editor {
  --editor-border-radius: 6px;
  --editor-focus-color: rgb(59 130 246);
}
</style>
