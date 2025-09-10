<template>
  <div
    class="ck-editor-container"
    :class="{ 'ck-focused': editorStore.isFocused }"
    ref="root">
    <Toolbar
      :tools="tools"
      :canUndo="editorStore.canUndo"
      :canRedo="editorStore.canRedo"
      :activeStates="activeStates"
      :currentHeading="editorStore.currentHeading"
      :currentTextColor="editorStore.currentTextColor"
      :currentHighlightColor="editorStore.currentHighlightColor"
      :currentTableHeaderColor="editorStore.currentTableHeaderColor"
      :isInTableCell="editorStore.isInTableCell"
      :isCodeView="editorStore.isCodeView"
      @execCommand="handleExecCommand"
      @changeHeading="handleChangeHeading"
      @changeTextColor="handleChangeTextColor"
      @applyHighlight="handleApplyHighlight"
      @insertTableRow="handleInsertTableRow"
      @deleteTableRow="handleDeleteTableRow"
      @insertTableColumn="handleInsertTableColumn"
      @deleteTableColumn="handleDeleteTableColumn"
      @changeTableHeaderColor="handleChangeTableHeaderColor"
      @toggleTableHeader="handleToggleTableHeader"
      @createTableFromGrid="handleCreateTableFromGrid"
      @showCustomTableDialog="handleShowCustomTableDialog"
      @insertLink="handleInsertLink"
      @toggleCodeView="handleToggleCodeView" />

    <EditorArea
      v-model="content"
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
      :visible="showContextMenu"
      :style="contextMenuStyle"
      :currentHighlightColor="editorStore.currentHighlightColor"
      :isActive="isCommandActive"
      @execCommand="handleExecCommand"
      @insertLink="handleInsertLink"
      @applyHighlight="handleApplyHighlight"
      ref="contextMenuRef" />

    <StatusBar
      :wordCount="editorStore.wordCount"
      :characterCount="editorStore.characterCount"
      @startResize="handleStartResize" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import Toolbar from "./Toolbar/Toolbar.vue";
import EditorArea from "./EditorArea.vue";
import ContextMenu from "./ContextMenu.vue";
import StatusBar from "./StatusBar.vue";
import { useEditorStore } from "../stores/editorStore";
import {
  execCommand,
  isCommandActive,
  isCommandEnabled,
} from "../utils/commands";
import {
  saveSelection,
  restoreSelection,
  getSelectedText,
} from "../utils/selection";
import {
  sanitizeHtmlSnippet,
  escapeHtml,
  escapeHtmlAttr,
} from "../utils/sanitizer";
import {
  insertTableRow,
  deleteTableRow,
  insertTableColumn,
  deleteTableColumn,
  toggleTableHeader,
  changeTableHeaderColor,
  createTable,
} from "../utils/tableOperations";
import type { ToolName } from "../types";

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

onMounted(() => {
  if (props.tools) editorStore.setTools(props.tools);
});

// Refs
const root = ref<HTMLElement>();
const editorAreaRef = ref<InstanceType<typeof EditorArea>>();
const contextMenuRef = ref<InstanceType<typeof ContextMenu>>();

// State
const content = ref(props.modelValue || "");
const showContextMenu = ref(false);
const contextMenuStyle = ref<Record<string, string>>({});
const savedSelection = ref<Range | null>(null);

// Computed
const tools = computed(() => {
  if (props.tools && props.tools.length > 0) {
    return props.tools;
  }
  // Default tools
  return [
    "undo",
    "redo",
    "bold",
    "italic",
    "underline",
    "heading",
    "foreColor",
    "highlight",
    "table",
    "insertLink",
    "insertUnorderedList",
    "insertOrderedList",
    "justifyLeft",
    "justifyCenter",
    "justifyRight",
    "codeView",
    "justifyFull",
    "insertHorizontalRule",
    "table",
  ] as ToolName[];
});

const activeStates = computed(() => {
  const states: Record<string, boolean> = {};

  if (editorStore.isCodeView) return states;

  // Check active states for formatting commands
  const commands = [
    "bold",
    "italic",
    "underline",
    "strikeThrough",
    "superscript",
    "subscript",
    "insertUnorderedList",
    "insertOrderedList",
    "justifyFull",
  ];

  commands.forEach((cmd) => {
    states[cmd] = isCommandActive(cmd);
  });

  return states;
});

// Utility Functions
const updateContent = () => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  const newContent = editorStore.isCodeView
    ? editable.textContent || ""
    : editable.innerHTML;

  content.value = newContent;
  editorStore.setContent(newContent);
  emit("update:modelValue", newContent);
  emit("change", newContent);
};

const updateToolbarState = () => {
  nextTick(() => {
    try {
      editorStore.setCanUndo(isCommandEnabled("undo"));
      editorStore.setCanRedo(isCommandEnabled("redo"));
    } catch {
      editorStore.setCanUndo(false);
      editorStore.setCanRedo(false);
    }

    updateHeadingState();
    checkTableCellState();
  });
};

const updateHeadingState = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    editorStore.setCurrentHeading("Paragraph");
    return;
  }

  let node = sel.anchorNode;
  if (!node) {
    editorStore.setCurrentHeading("Paragraph");
    return;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  const editable = editorAreaRef.value?.editable;
  while (node && node !== editable) {
    if (node instanceof HTMLElement) {
      const tag = node.tagName?.toLowerCase();
      if (tag && tag.startsWith("h") && tag.length === 2 && /\d/.test(tag[1])) {
        editorStore.setCurrentHeading(`Heading ${tag[1]}`);
        return;
      }
    }
    node = node.parentElement;
  }
  editorStore.setCurrentHeading("Paragraph");
};

const checkTableCellState = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    editorStore.setInTableCell(false);
    return;
  }

  let node = sel.anchorNode;
  if (node && node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  let inTable = false;
  const editable = editorAreaRef.value?.editable;
  while (node && node !== editable) {
    if (
      node instanceof HTMLElement &&
      (node.tagName === "TH" || node.tagName === "TD")
    ) {
      inTable = true;
      break;
    }
    node = node.parentElement;
  }

  editorStore.setInTableCell(inTable);
};

// Event Handlers
const handleInput = () => {
  updateContent();
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
      handleExecCommand(cmd);
    }
    if (k === "k") {
      event.preventDefault();
      handleInsertLink();
    }
    if (k === "h") {
      event.preventDefault();
      handleApplyHighlight(editorStore.currentHighlightColor);
    }
    if (k === "=") {
      event.preventDefault();
      handleExecCommand("subscript");
    }
  }

  // Superscript: Ctrl/Cmd + Shift + =
  if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
    if (event.key === "=" || event.key === "+") {
      event.preventDefault();
      handleExecCommand("superscript");
    }
  }

  // Undo/Redo
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    if (event.shiftKey) {
      event.preventDefault();
      handleExecCommand("redo");
    } else {
      event.preventDefault();
      handleExecCommand("undo");
    }
  }

  // Tab in code view
  if (event.key === "Tab" && editorStore.isCodeView) {
    event.preventDefault();
    document.execCommand("insertText", false, "  ");
  }

  if (event.key === "Escape") {
    editorStore.closeAllDropdowns();
    showContextMenu.value = false;
  }
};

const handleKeyup = () => {
  updateToolbarState();
};

const handleMouseup = () => {
  updateToolbarState();
  setTimeout(showFloatingToolbar, 10);
};

const handleFocus = () => {
  editorStore.setFocused(true);
  emit("focus");
};

const handleBlur = () => {
  editorStore.setFocused(false);
  showContextMenu.value = false;
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

  execCommand("insertHTML", sanitized);
  setTimeout(updateContent, 0);
};

// Command Handlers
const handleExecCommand = (command: string, value?: string) => {
  if (editorStore.isCodeView && !["undo", "redo"].includes(command)) return;

  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  if (command === "insertHTML" || command === "insertText") {
    editable.focus();
  }

  const success = execCommand(command, value || null);
  if (success) {
    updateContent();
    updateToolbarState();
  }
};

const handleChangeHeading = (level: string) => {
  if (editorStore.isCodeView) return;

  if (level === "paragraph") {
    handleExecCommand("formatBlock", "<p>");
  } else {
    handleExecCommand("formatBlock", `<${level}>`);
  }
  editorStore.closeAllDropdowns();
};

const handleChangeTextColor = (color: string) => {
  editorStore.setCurrentTextColor(color);
  handleExecCommand("foreColor", color);
  editorStore.closeAllDropdowns();
};

const handleApplyHighlight = (color: string) => {
  if (editorStore.isCodeView) return;

  if (color === "transparent") {
    handleExecCommand("hiliteColor", "transparent");
    handleExecCommand("backColor", "transparent");
  } else {
    handleExecCommand("hiliteColor", color);
    if (!document.queryCommandSupported("hiliteColor")) {
      handleExecCommand("backColor", color);
    }
  }

  editorStore.setCurrentHighlightColor(color);
  editorStore.closeAllDropdowns();
};

const handleInsertLink = () => {
  const selText = getSelectedText();
  const url = prompt("Enter URL", "https://");
  if (!url) return;

  if (selText) {
    handleExecCommand("createLink", url);
  } else {
    const text = prompt("Link text", url) || url;
    handleExecCommand(
      "insertHTML",
      `<a href="${escapeHtmlAttr(
        url
      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`
    );
  }
  updateToolbarState();
};

const handleToggleCodeView = () => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  editorStore.toggleCodeView();

  if (editorStore.isCodeView) {
    editable.textContent = editable.innerHTML;
  } else {
    editable.innerHTML = editable.textContent || "<p></p>";
  }

  updateContent();
  updateToolbarState();
};

// Table Handlers
const handleInsertTableRow = (position: "above" | "below") => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  insertTableRow(editable, position, editorStore.currentTableHeaderColor);
  editorStore.closeAllDropdowns();
  updateContent();
};

const handleDeleteTableRow = () => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  deleteTableRow(editable);
  editorStore.closeAllDropdowns();
  updateContent();
};

const handleInsertTableColumn = (position: "left" | "right") => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  insertTableColumn(editable, position, editorStore.currentTableHeaderColor);
  editorStore.closeAllDropdowns();
  updateContent();
};

const handleDeleteTableColumn = () => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  deleteTableColumn(editable);
  editorStore.closeAllDropdowns();
  updateContent();
};

const handleChangeTableHeaderColor = (color: string) => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  editorStore.setCurrentTableHeaderColor(color);
  changeTableHeaderColor(editable, color);
  editorStore.closeAllDropdowns();
  updateContent();
};

const handleToggleTableHeader = () => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  toggleTableHeader(editable, editorStore.currentTableHeaderColor);
  editorStore.closeAllDropdowns();
  updateContent();
  updateToolbarState();
};

const handleCreateTableFromGrid = (rows: number, cols: number) => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  // Save selection before creating table
  savedSelection.value = saveSelection(editable);

  // Create table HTML
  const tableHtml = createTable(
    rows,
    cols,
    editorStore.currentTableHeaderColor
  );

  // Restore selection and insert table
  if (savedSelection.value) {
    restoreSelection(savedSelection.value);
  }

  const success = execCommand("insertHTML", tableHtml);

  if (!success && savedSelection.value) {
    // Fallback insertion method
    try {
      editable.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection.value);

        const temp = document.createElement("div");
        temp.innerHTML = tableHtml;

        const range = savedSelection.value.cloneRange();
        range.deleteContents();

        Array.from(temp.childNodes).forEach((node) => {
          range.insertNode(node.cloneNode(true));
          range.collapse(false);
        });

        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.error("Table insertion failed:", error);
    }
  }

  editorStore.closeAllDropdowns();
  updateContent();
  updateToolbarState();
  savedSelection.value = null;
};

const handleShowCustomTableDialog = () => {
  const editable = editorAreaRef.value?.editable;
  if (!editable) return;

  savedSelection.value = saveSelection(editable);

  const rowsInput = prompt("Number of rows:", "3");
  if (rowsInput === null) return;

  const rows = parseInt(rowsInput, 10);
  if (!rows || rows < 1) return;

  const colsInput = prompt("Number of columns:", "3");
  if (colsInput === null) return;

  const cols = parseInt(colsInput, 10);
  if (!cols || cols < 1) return;

  handleCreateTableFromGrid(rows, cols);
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

// Context Menu
const showFloatingToolbar = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    showContextMenu.value = false;
    return;
  }

  const text = sel.toString().trim();
  if (!text) {
    showContextMenu.value = false;
    return;
  }

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  showContextMenu.value = true;
  contextMenuStyle.value = {
    position: "fixed",
    top: `${Math.max(8, rect.top - 48)}px`,
    left: `${Math.min(
      window.innerWidth - 160,
      rect.left + rect.width / 2 - 60
    )}px`,
    zIndex: "99999",
  };
};

// Click Outside Handler
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;

  if (root.value && !root.value.contains(target)) {
    editorStore.closeAllDropdowns();
    showContextMenu.value = false;
  }

  if (
    contextMenuRef.value?.contextMenu &&
    !contextMenuRef.value.contextMenu.contains(target)
  ) {
    showContextMenu.value = false;
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
    updateToolbarState();
    setTimeout(showFloatingToolbar, 10);
  } else {
    showContextMenu.value = false;
  }
};

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== content.value) {
      content.value = newValue || "";
      editorStore.setContent(content.value);
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
  if (props.modelValue) {
    content.value = props.modelValue;
    editorStore.setContent(content.value);
  }

  document.addEventListener("selectionchange", onSelectionChange);
  document.addEventListener("click", handleClickOutside);
  updateToolbarState();
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
