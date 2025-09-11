<template>
  <div class="relative">
    <div
      ref="editorElement"
      class="min-h-[200px] p-4 outline-none overflow-wrap-break-word"
      :class="{
        'font-mono whitespace-pre-wrap bg-gray-50': editorStore.isCodeView,
        'prose max-w-none': !editorStore.isCodeView,
      }"
      contenteditable="true"
      @input="handleInput"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @mouseup="handleMouseup"
      @focus="handleFocus"
      @blur="handleBlur"
      @paste="handlePaste"
      spellcheck="true"
      role="textbox"
      :aria-label="placeholder" />

    <!-- Context Menu -->
    <ContextMenu />
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from "@/stores/editorStore";
import { useTableStore } from "@/stores/tableStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { onMounted, onUnmounted, ref } from "vue";
import ContextMenu from "./ContextMenu.vue";

interface Props {
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Start typing...",
});

const editorElement = ref<HTMLElement>();
const editorStore = useEditorStore();
const toolbarStore = useToolbarStore();
const tableStore = useTableStore();

// FIXED: Enhanced focus management
const handleFocus = () => {
  editorStore.isFocused = true;
};

const handleBlur = (event: FocusEvent) => {
  // Check if focus is moving to a toolbar element
  const relatedTarget = event.relatedTarget as Element;

  // If focus is moving to toolbar, don't blur
  if (relatedTarget && relatedTarget.closest(".toolbar")) {
    event.preventDefault();
    editorStore.ensureFocus();
    return;
  }

  editorStore.isFocused = false;
  editorStore.showContextMenu = false;
};

const handleInput = () => {
  if (editorElement.value) {
    const content = editorStore.isCodeView
      ? editorElement.value.textContent || ""
      : editorElement.value.innerHTML;
    editorStore.setContent(content);
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  // Handle keyboard shortcuts
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
    const key = event.key.toLowerCase();
    if (["b", "i", "u"].includes(key)) {
      event.preventDefault();
      const command =
        key === "b" ? "bold" : key === "i" ? "italic" : "underline";
      editorStore.maintainFocus(() => {
        document.execCommand(command);
      });
    }
  }

  // Handle undo/redo
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      editorStore.maintainFocus(() => document.execCommand("redo"));
    } else {
      editorStore.maintainFocus(() => document.execCommand("undo"));
    }
  }

  if (event.key === "Enter") {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      if (node?.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }

      // Check if we're in a list item
      while (node && node !== editorStore.editorElement) {
        if ((node as Element).tagName === "LI") {
          event.preventDefault();
          createNewListItem(node as HTMLElement, selection);
          return;
        }
        node = (node as Element).parentElement;
      }
    }
  }
};

const createNewListItem = (currentLI: HTMLElement, selection: Selection) => {
  const list = currentLI.parentElement;
  if (!list) return;

  const newLI = document.createElement("li");
  newLI.innerHTML = "&nbsp;";
  newLI.style.cssText = currentLI.style.cssText;

  // Insert after current item
  if (currentLI.nextSibling) {
    list.insertBefore(newLI, currentLI.nextSibling);
  } else {
    list.appendChild(newLI);
  }

  // Place cursor in new list item
  const range = document.createRange();
  range.setStart(newLI, 0);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);

  newLI.focus();
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

const handlePaste = (event: ClipboardEvent) => {
  if (!editorElement.value) return;
  event.preventDefault();

  const clipboard = event.clipboardData;
  const html = clipboard?.getData("text/html");
  const text = clipboard?.getData("text/plain");

  let sanitized = "";
  if (html) {
    sanitized = sanitizeHtml(html);
  } else if (text) {
    sanitized = escapeHtml(text);
  }

  editorStore.maintainFocus(() => {
    document.execCommand("insertHTML", false, sanitized);
  });
};

const sanitizeHtml = (html: string): string => {
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Remove script and style tags
  temp.querySelectorAll("script, style").forEach((el) => el.remove());

  // Remove event handlers
  temp.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return temp.innerHTML;
};

const escapeHtml = (text: string): string => {
  return text.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] || char;
  });
};

onMounted(() => {
  if (editorElement.value) {
    editorStore.setEditorElement(editorElement.value);
    editorElement.value.innerHTML = editorStore.content || "<p></p>";
  }
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>

<style scoped>
/* Enhanced link styling for the editor */
.editor-content :deep(a),
.editor-content :deep(a.editor-link) {
  color: #2563eb !important;
  text-decoration: underline !important;
  text-decoration-color: #2563eb !important;
  text-underline-offset: 2px !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
}

.editor-content :deep(a:hover),
.editor-content :deep(a.editor-link:hover) {
  color: #1d4ed8 !important;
  text-decoration-color: #1d4ed8 !important;
  text-decoration-thickness: 2px !important;
  transform: translateY(-1px) !important;
  text-shadow: 0 1px 3px rgba(29, 78, 216, 0.2) !important;
}

.editor-content :deep(a:active),
.editor-content :deep(a.editor-link:active) {
  color: #1e40af !important;
  transform: translateY(0) !important;
}

/* Visited link styling */
.editor-content :deep(a:visited),
.editor-content :deep(a.editor-link:visited) {
  color: #7c3aed !important;
  text-decoration-color: #7c3aed !important;
}

.editor-content :deep(a:visited:hover),
.editor-content :deep(a.editor-link:visited:hover) {
  color: #6d28d9 !important;
  text-decoration-color: #6d28d9 !important;
}

/* Focus styles for accessibility */
.editor-content :deep(a:focus),
.editor-content :deep(a.editor-link:focus) {
  outline: 2px solid #2563eb !important;
  outline-offset: 2px !important;
  border-radius: 2px !important;
}

/* Code view link styling */
.editor-content.font-mono :deep(a) {
  font-family: "Courier New", monospace !important;
  background-color: rgba(37, 99, 235, 0.1) !important;
  padding: 2px 4px !important;
  border-radius: 3px !important;
}
</style>
