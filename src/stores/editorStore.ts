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

  // FIXED: Improved toolbar state update with better redo detection
  const executeCommand = (command: string, value: any = null) => {
    if (!editorElement.value) return false;

    // For undo/redo, allow in both modes
    if (command === "undo" || command === "redo") {
      try {
        const success = document.execCommand(command, false, value);
        setTimeout(() => updateToolbarState(), 10);
        return success;
      } catch (e) {
        console.warn("Command error:", e);
        return false;
      }
    }

    // Don't allow other commands in code view
    if (isCodeView.value) return false;

    // Ensure editor has focus
    if (document.activeElement !== editorElement.value) {
      editorElement.value.focus();
    }

    // Small delay to ensure focus is established
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const success = document.execCommand(command, false, value);
          console.log(`execCommand ${command}:`, success);

          if (success) {
            updateToolbarState();
          }
          resolve(success);
        } catch (e) {
          console.warn("Command error:", e);
          resolve(false);
        }
      }, 10);
    });
  };

  const updateToolbarState = () => {
    nextTick(() => {
      try {
        // Enhanced redo detection
        canUndo.value =
          document.queryCommandEnabled("undo") &&
          document.queryCommandState("undo") !== null;

        // Try multiple approaches for redo detection
        let hasRedo = false;
        try {
          hasRedo =
            document.queryCommandEnabled("redo") &&
            document.queryCommandState("redo") !== null;
        } catch (e) {
          // Fallback redo detection
          const selection = window.getSelection();
          const range =
            selection && selection.rangeCount > 0
              ? selection.getRangeAt(0).cloneRange()
              : null;

          try {
            // Test if redo is available by attempting it
            hasRedo = document.execCommand("redo", false, undefined);
            if (hasRedo) {
              // Undo the redo we just did to check
              document.execCommand("undo", false, undefined);
            }
          } catch (err) {
            hasRedo = false;
          }

          // Restore selection if it existed
          if (range && selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        canRedo.value = hasRedo;
      } catch (error) {
        canUndo.value = false;
        canRedo.value = false;
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
        editorElement.value.contains(container as Node) ||
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
          range.setStart(lastChild, (lastChild.textContent || "").length);
          range.setEnd(lastChild, (lastChild.textContent || "").length);
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

  // FIXED: Improved code view toggle with proper state management
  const toggleCodeView = () => {
    if (!editorElement.value) return;

    const currentSelection = window.getSelection();
    let selectionInfo: any = null;

    if (currentSelection && currentSelection.rangeCount > 0) {
      const range = currentSelection.getRangeAt(0);
      selectionInfo = {
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        startContainer: range.startContainer,
        endContainer: range.endContainer,
      };
    }

    if (isCodeView.value) {
      // Switching from code view to WYSIWYG
      const textContent = editorElement.value.textContent || "";

      // Clear the editor first
      editorElement.value.innerHTML = "";

      // Set the HTML content
      editorElement.value.innerHTML = textContent || "<p></p>";

      isCodeView.value = false;

      // Restore focus and reinitialize editor state
      setTimeout(() => {
        if (!editorElement.value) return;

        editorElement.value.focus();

        // Place cursor at the end
        const range = document.createRange();
        const selection = window.getSelection();

        if (editorElement.value.childNodes.length > 0) {
          const lastNode = editorElement.value.lastChild!;
          if (lastNode.nodeType === Node.TEXT_NODE) {
            range.setStart(lastNode, (lastNode.textContent || "").length);
          } else {
            range.setStartAfter(lastNode);
          }
        } else {
          range.setStart(editorElement.value, 0);
        }

        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Force update toolbar state and reset command history tracking
        updateToolbarState();
        refreshHistoryState();
      }, 50);
    } else {
      // Switching from WYSIWYG to code view
      const htmlContent = editorElement.value.innerHTML || "";

      // Save current state before switching
      savedSelection.value =
        currentSelection && currentSelection.rangeCount > 0
          ? currentSelection.getRangeAt(0).cloneRange()
          : null;

      // Clear and set text content
      editorElement.value.innerHTML = "";
      editorElement.value.textContent = htmlContent;

      isCodeView.value = true;

      // Restore focus
      setTimeout(() => {
        if (!editorElement.value) return;

        editorElement.value.focus();

        // Place cursor at end of text
        const textLength = (editorElement.value.textContent || "").length;
        const range = document.createRange();
        const selection = window.getSelection();

        if (
          editorElement.value.firstChild &&
          editorElement.value.firstChild.nodeType === Node.TEXT_NODE
        ) {
          const textNode = editorElement.value.firstChild;
          const maxOffset = Math.min(
            textLength,
            (textNode.textContent || "").length
          );
          range.setStart(textNode, maxOffset);
          range.setEnd(textNode, maxOffset);
        } else {
          range.setStart(editorElement.value, 0);
          range.setEnd(editorElement.value, 0);
        }

        selection?.removeAllRanges();
        selection?.addRange(range);

        updateToolbarState();
        refreshHistoryState();
      }, 50);
    }
  };

  // Helper function to refresh history state
  const refreshHistoryState = () => {
    setTimeout(() => {
      try {
        canUndo.value = document.queryCommandEnabled("undo");
        canRedo.value = document.queryCommandEnabled("redo");
      } catch {
        canUndo.value = false;
        canRedo.value = false;
      }
    }, 100);
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

  const maintainFocus = (callback: () => void) => {
    if (!editorElement.value) {
      callback();
      return;
    }

    // Save current selection
    const selection = window.getSelection();
    const savedRange =
      selection && selection.rangeCount > 0
        ? selection.getRangeAt(0).cloneRange()
        : null;

    // Ensure editor has focus
    editorElement.value.focus();

    // Execute callback after a small delay
    setTimeout(() => {
      callback();

      // Restore selection if it was saved
      if (savedRange && selection) {
        setTimeout(() => {
          try {
            selection.removeAllRanges();
            selection.addRange(savedRange);
            editorElement.value?.focus();
          } catch (e) {
            // If range is invalid, just focus the editor
            editorElement.value?.focus();
          }
        }, 5);
      }
    }, 5);
  };

  const ensureFocus = () => {
    if (editorElement.value && document.activeElement !== editorElement.value) {
      editorElement.value.focus();
    }
  };

  const preventBlur = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    ensureFocus();
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

    // Actions
    setContent,
    setEditorElement,
    setEnabledTools,
    updateToolbarState,
    saveSelection,
    restoreSelection,
    toggleCodeView,
    refreshHistoryState,
    showFloatingToolbar,
    isToolEnabled,
    maintainFocus,
    ensureFocus,
    preventBlur,
    executeCommand,
  };
});
