import type { ToolName } from "@/types";
import { defineStore } from "pinia";
import { computed, nextTick, ref } from "vue";

export const useEditorStore = defineStore("editor", () => {
  // State
  const content = ref("");
  const isFocused = ref(false);
  const isCodeView = ref(false);
  const canUndo = ref(false);
  const canRedo = ref(false);
  const showContextMenu = ref(false);
  const contextMenuStyle = ref<Record<string, string>>({});
  const savedSelection = ref<Range | null>(null);
  const editorElement = ref<HTMLElement | null>(null);
  const enabledTools = ref<ToolName[]>([]);

  // Computed
  const wordCount = computed(() => {
    if (!editorElement.value) return 0;
    const text = isCodeView.value
      ? editorElement.value.textContent
      : editorElement.value.innerText || "";
    const trimmed = (text || "").trim();
    return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  });

  const characterCount = computed(() => {
    if (!editorElement.value) return 0;
    const text = isCodeView.value
      ? editorElement.value.textContent
      : editorElement.value.innerText || "";
    return (text || "").length;
  });

  const isToolEnabled = (tool: ToolName) => {
    return enabledTools.value.includes(tool);
  };

  // Actions
  const setContent = (newContent: string) => {
    content.value = newContent;
  };

  const setEditorElement = (element: HTMLElement) => {
    editorElement.value = element;
  };

  const setEnabledTools = (tools: ToolName[]) => {
    enabledTools.value = tools;
  };

  const updateToolbarState = () => {
    nextTick(() => {
      try {
        canUndo.value = document.queryCommandEnabled?.("undo") || false;
        canRedo.value = document.queryCommandEnabled?.("redo") || false;
      } catch {
        canUndo.value = canRedo.value = false;
      }
    });
  };

  const saveSelection = () => {
    const selection = window.getSelection();

    const isCursorInEditor = () => {
      if (!selection?.rangeCount || !editorElement.value) return false;
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      return (
        editorElement.value.contains(container) ||
        editorElement.value === container
      );
    };

    if (isCursorInEditor()) {
      savedSelection.value = selection!.getRangeAt(0).cloneRange();
    } else if (editorElement.value) {
      editorElement.value.focus();
      const range = document.createRange();

      if (editorElement.value.childNodes.length > 0) {
        const lastChild = editorElement.value.lastChild!;
        if (lastChild.nodeType === Node.TEXT_NODE) {
          range.setStart(lastChild, lastChild.textContent?.length || 0);
          range.setEnd(lastChild, lastChild.textContent?.length || 0);
        } else {
          range.setStartAfter(lastChild);
          range.setEndAfter(lastChild);
        }
      } else {
        range.setStart(editorElement.value, 0);
        range.setEnd(editorElement.value, 0);
      }

      selection?.removeAllRanges();
      selection?.addRange(range);
      savedSelection.value = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedSelection.value && editorElement.value) {
      editorElement.value.focus();
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelection.value);
    }
  };

  const toggleCodeView = () => {
    if (!editorElement.value) return;

    isCodeView.value = !isCodeView.value;

    if (isCodeView.value) {
      editorElement.value.textContent = editorElement.value.innerHTML;
    } else {
      editorElement.value.innerHTML = editorElement.value.textContent || "";
    }

    setContent(
      isCodeView.value
        ? editorElement.value.textContent || ""
        : editorElement.value.innerHTML
    );
  };

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

  return {
    // State
    content,
    isFocused,
    isCodeView,
    canUndo,
    canRedo,
    showContextMenu,
    contextMenuStyle,
    savedSelection,
    editorElement,
    enabledTools,

    // Computed
    wordCount,
    characterCount,
    isToolEnabled,

    // Actions
    setContent,
    setEditorElement,
    setEnabledTools,
    updateToolbarState,
    saveSelection,
    restoreSelection,
    toggleCodeView,
    showFloatingToolbar,
  };
});
