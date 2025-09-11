<template>
  <div class="editor-main">
    <div
      ref="editorRef"
      class="editor-content"
      :class="{
        'code-view': editorStore.isCodeView,
        disabled: disabled,
        readonly: readonly,
      }"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="handleInput"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @mouseup="handleMouseup"
      @focus="handleFocus"
      @blur="handleBlur"
      @paste="handlePaste"
      spellcheck="true"
      role="textbox"
      aria-label="Rich text editor" />

    <div
      v-if="showResizeHandle"
      class="resize-handle"
      @mousedown="startResize" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { useEditorStore } from "@/stores/editorStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { useTableStore } from "@/stores/tableStore";
import { execCommand } from "@/utils/commands";
import { sanitizeHtmlSnippet } from "@/utils/sanitize";

interface Props {
  modelValue: string;
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  showResizeHandle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showResizeHandle: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const editorRef = ref<HTMLElement>();
const editorStore = useEditorStore();
const toolbarStore = useToolbarStore();
const tableStore = useTableStore();

onMounted(() => {
  if (editorRef.value) {
    editorStore.setEditorElement(editorRef.value);
    editorRef.value.innerHTML = props.modelValue || "<p></p>";
  }
});

const handleInput = () => {
  updateContent();
};

const handleKeydown = (e: KeyboardEvent) => {
  // Handle keyboard shortcuts
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
    const key = e.key.toLowerCase();
    if (key === "b" || key === "i" || key === "u") {
      e.preventDefault();
      const command =
        key === "b" ? "bold" : key === "i" ? "italic" : "underline";
      if (editorStore.isToolEnabled(command as any)) {
        execCommand(command);
      }
    }
    if (key === "k" && editorStore.isToolEnabled("link")) {
      e.preventDefault();
      // Insert link logic
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    if (e.shiftKey && editorStore.isToolEnabled("redo")) {
      e.preventDefault();
      execCommand("redo");
    } else if (editorStore.isToolEnabled("undo")) {
      e.preventDefault();
      execCommand("undo");
    }
  }

  if (e.key === "Tab" && editorStore.isCodeView) {
    e.preventDefault();
    document.execCommand("insertText", false, "  ");
  }

  if (e.key === "Escape") {
    toolbarStore.closeAllDropdowns();
    editorStore.showContextMenu = false;
  }
};

const handleKeyup = () => {
  editorStore.updateToolbarState();
  toolbarStore.updateHeadingState();
  tableStore.checkTableCellState();
};

const handleMouseup = () => {
  editorStore.updateToolbarState();
  toolbarStore.updateHeadingState();
  tableStore.checkTableCellState();
  setTimeout(() => editorStore.showFloatingToolbar(), 10);
};

const handleFocus = (e: FocusEvent) => {
  editorStore.isFocused = true;
  emit("focus", e);
};

const handleBlur = (e: FocusEvent) => {
  cleanupTrailingEmptyContent();
  editorStore.isFocused = false;
  editorStore.showContextMenu = false;
  emit("blur", e);
};

const handlePaste = (event: ClipboardEvent) => {
  if (!editorRef.value) return;
  event.preventDefault();

  const clipboard = event.clipboardData;
  if (!clipboard) return;

  const html = clipboard.getData("text/html");
  const text = clipboard.getData("text/plain");

  let sanitized = "";
  if (html) {
    sanitized = sanitizeHtmlSnippet(html);
  } else {
    sanitized = text.replace(
      /[&<>"']/g,
      (s) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[s] || s)
    );
  }

  document.execCommand("insertHTML", false, sanitized);
  setTimeout(updateContent, 0);
};

const updateContent = () => {
  if (!editorRef.value) return;

  const content = editorStore.isCodeView
    ? editorRef.value.textContent || ""
    : editorRef.value.innerHTML;

  editorStore.setContent(content);
  emit("update:modelValue", content);
  emit("change", content);
};

const cleanupTrailingEmptyContent = () => {
  if (!editorRef.value) return;

  if (editorStore.isCodeView) {
    const content = editorRef.value.textContent || "";
    const trimmed = content.replace(/\s+$/, "");
    if (content !== trimmed) {
      editorRef.value.textContent = trimmed;
      updateContent();
    }
    return;
  }

  // Cleanup logic for HTML view
  const container = editorRef.value;
  let hasChanges = false;

  while (container.lastElementChild) {
    const lastElement = container.lastElementChild;
    const tagName = lastElement.tagName.toLowerCase();
    const textContent = lastElement.textContent || "";
    const innerHTML = lastElement.innerHTML || "";

    const isEmpty =
      textContent.trim() === "" ||
      innerHTML === "<br>" ||
      innerHTML === "&nbsp;" ||
      innerHTML === "" ||
      /^(\s|&nbsp;|<br\s*\/?>)*$/.test(innerHTML);

    if ((tagName === "p" || tagName === "div" || tagName === "br") && isEmpty) {
      container.removeChild(lastElement);
      hasChanges = true;
    } else {
      break;
    }
  }

  if (!container.children.length || container.innerHTML.trim() === "") {
    container.innerHTML = "<p></p>";
    hasChanges = true;
  }

  if (hasChanges) {
    updateContent();
  }
};

const startResize = (e: MouseEvent) => {
  e.preventDefault();
  const startY = e.clientY;
  const startHeight = editorRef.value?.offsetHeight || 0;

  const onMouseMove = (ev: MouseEvent) => {
    const newH = startHeight + (ev.clientY - startY);
    if (editorRef.value) {
      editorRef.value.style.minHeight = `${Math.max(160, newH)}px`;
    }
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (!editorRef.value) return;

    const current = editorStore.isCodeView
      ? editorRef.value.textContent
      : editorRef.value.innerHTML;

    if (newValue !== current) {
      editorRef.value.innerHTML = newValue || "<p></p>";
    }
  }
);
</script>

<style scoped>
.editor-main {
  position: relative;
}

.editor-content {
  min-height: 200px;
  padding: 16px;
  outline: none;
  overflow-wrap: break-word;
  background: transparent;
}

.editor-content.code-view {
  font-family: "Courier New", monospace;
  white-space: pre-wrap;
  background: rgb(248 250 252);
}

.editor-content.disabled {
  pointer-events: none;
  opacity: 0.6;
}

.editor-content.readonly {
  background: rgb(249 250 251);
}

.editor-content:empty::before {
  content: attr(data-placeholder);
  color: rgb(156 163 175);
  pointer-events: none;
}

.editor-content :deep(p) {
  margin: 0 0 1em 0;
}

.editor-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.editor-content :deep(td),
.editor-content :deep(th) {
  border: 1px solid #ccc;
  padding: 8px;
  vertical-align: top;
  min-height: 20px;
}

.editor-content :deep(th) {
  background-color: #f0f0f0;
  font-weight: bold;
  text-align: center;
}

.resize-handle {
  width: 16px;
  height: 16px;
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, transparent 50%, rgb(156 163 175) 50%);
  cursor: nw-resize;
  border-radius: 0 0 6px 0;
}
</style>
