<template>
  <div
    class="ck-editor-container"
    :class="{ 'ck-focused': editorStore.isFocused }"
    ref="root">
    <Toolbar
      @execCommand="editorStore.handleExecCommand"
      @changeHeading="editorStore.handleChangeHeading"
      @changeTextColor="editorStore.handleChangeTextColor"
      @applyHighlight="editorStore.handleApplyHighlight"
      @insertTableRow="editorStore.handleInsertTableRow"
      @deleteTableRow="editorStore.handleDeleteTableRow"
      @insertTableColumn="editorStore.handleInsertTableColumn"
      @deleteTableColumn="editorStore.handleDeleteTableColumn"
      @changeTableHeaderColor="editorStore.handleChangeTableHeaderColor"
      @toggleTableHeader="editorStore.handleToggleTableHeader"
      @createTableFromGrid="editorStore.handleCreateTableFromGrid"
      @showCustomTableDialog="editorStore.handleShowCustomTableDialog"
      @insertLink="editorStore.handleInsertLink" />

    <EditorArea
      v-model="editorStore.content"
      :isCodeView="editorStore.isCodeView"
      :placeholder="placeholder"
      @input="handleInput"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @mouseup="handleMouseup"
      @focus="handleFocus"
      @blur="handleBlur"
      @paste="handlePaste"
      ref="editorAreaRef" />

    <ContextMenu
      :visible="editorStore.showContextMenu"
      :style="editorStore.contextMenuStyle"
      :currentHighlightColor="editorStore.currentHighlightColor"
      :isActive="isCommandActive"
      @execCommand="editorStore.handleExecCommand"
      @insertLink="editorStore.handleInsertLink"
      @applyHighlight="editorStore.handleApplyHighlight"
      ref="contextMenuRef" />

    <StatusBar
      :wordCount="editorStore.wordCount"
      :characterCount="editorStore.characterCount"
      @startResize="handleStartResize" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useEditorStore } from "../stores/editorStore";
import type { ToolName } from "../types";
import { isCommandActive } from "../utils/commands";
import { escapeHtml, sanitizeHtmlSnippet } from "../utils/sanitizer";
import ContextMenu from "./ContextMenu.vue";
import EditorArea from "./EditorArea.vue";
import StatusBar from "./StatusBar.vue";
import Toolbar from "./Toolbar/Toolbar.vue";

const props = defineProps<{
  modelValue?: string;
  tools?: ToolName[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
  focus: [];
  blur: [];
}>();

const editorStore = useEditorStore();

// Refs
const root = ref<HTMLElement>();
const editorAreaRef = ref<InstanceType<typeof EditorArea>>();

// Event Handlers
const handleInput = () => {
  editorStore.updateContent(emit);
};

const handleKeydown = (event: KeyboardEvent) => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  // Common shortcuts
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
    const k = event.key.toLowerCase();
    if (k === "b" || k === "i" || k === "u") {
      event.preventDefault();
      const cmd = k === "b" ? "bold" : k === "i" ? "italic" : "underline";
      editorStore.handleExecCommand(cmd, undefined, emit);
    }
    if (k === "k") {
      event.preventDefault();
      editorStore.handleInsertLink(emit);
    }
    if (k === "h") {
      event.preventDefault();
      editorStore.handleApplyHighlight(editorStore.currentHighlightColor, emit);
    }
    if (k === "=") {
      event.preventDefault();
      editorStore.handleExecCommand("subscript", undefined, emit);
    }
  }

  // Superscript: Ctrl/Cmd + Shift + =
  if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
    if (event.key === "=" || event.key === "+") {
      event.preventDefault();
      editorStore.handleExecCommand("superscript", undefined, emit);
    }
  }

  // Undo/Redo
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    if (event.shiftKey) {
      event.preventDefault();
      editorStore.handleExecCommand("redo", undefined, emit);
    } else {
      event.preventDefault();
      editorStore.handleExecCommand("undo", undefined, emit);
    }
  }

  // Tab in code view
  if (event.key === "Tab" && editorStore.isCodeView) {
    event.preventDefault();
    document.execCommand("insertText", false, "  ");
  }

  if (event.key === "Escape") {
    editorStore.closeAllDropdowns();
    editorStore.hideContextMenu();
  }
};

const handleKeyup = () => {
  editorStore.updateToolbarState();
};

const handleMouseup = () => {
  editorStore.updateToolbarState();
  setTimeout(editorStore.showFloatingToolbar, 10);
};

const handleFocus = () => {
  editorStore.setFocused(true);
  emit("focus");
};

const handleBlur = () => {
  editorStore.setFocused(false);
  editorStore.hideContextMenu();
  emit("blur");
};

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const clipboard = event.clipboardData;
  if (!clipboard) return;

  const html = clipboard.getData("text/html");
  const text = clipboard.getData("text/plain");

  let sanitized = "";
  if (html) {
    sanitized = sanitizeHtmlSnippet(html);
  } else {
    sanitized = escapeHtml(text);
  }

  editorStore.handleExecCommand("insertHTML", sanitized, emit);
};

// Resize Handler
const handleStartResize = (event: MouseEvent) => {
  event.preventDefault();
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  const startY = event.clientY;
  const startHeight = editable.offsetHeight;

  const onMouseMove = (ev: MouseEvent) => {
    const newHeight = startHeight + (ev.clientY - startY);
    editable.style.minHeight = `${Math.max(160, newHeight)}px`;
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

// Click Outside Handler
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;

  if (root.value && !root.value.contains(target)) {
    editorStore.closeAllDropdowns();
    editorStore.hideContextMenu();
  }
};

// Selection Change Handler
const onSelectionChange = () => {
  const sel = window.getSelection();
  if (!sel || !sel.anchorNode) return;

  let node =
    sel.anchorNode.nodeType === Node.TEXT_NODE
      ? sel.anchorNode.parentElement
      : sel.anchorNode;

  if (!node) return;

  const editable = editorAreaRef.value?.editable;
  if (editable && editable.contains(node)) {
    editorStore.updateToolbarState();
    setTimeout(editorStore.showFloatingToolbar, 10);
  } else {
    editorStore.hideContextMenu();
  }
};

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== editorStore.content) {
      editorStore.setContent(newValue || "");
    }
  }
);

watch(
  () => props.tools,
  (newTools) => {
    if (newTools) {
      editorStore.setSelectedTools(newTools);
    }
  },
  { immediate: true }
);

// Lifecycle
onMounted(() => {
  // Set editor ref in store
  editorStore.setEditorAreaRef(editorAreaRef.value);

  if (props.tools) editorStore.setTools(props.tools);

  if (props.modelValue) {
    editorStore.setContent(props.modelValue);
  }

  document.addEventListener("selectionchange", onSelectionChange);
  document.addEventListener("click", handleClickOutside);
  editorStore.updateToolbarState();
});

onUnmounted(() => {
  document.removeEventListener("selectionchange", onSelectionChange);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.ck-editor-container {
  border: 1px solid hsl(0, 0%, 87%);
  border-radius: 6px;
  background: hsl(0, 0%, 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial;
  font-size: 14px;
  --ck-border-radius: 6px;
  --ck-color-focus-border: hsl(208, 88%, 52%);
}

.ck-editor-container.ck-focused {
  border-color: var(--ck-color-focus-border);
  box-shadow: 0 0 0 2px rgba(14, 102, 255, 0.12);
}
</style>
