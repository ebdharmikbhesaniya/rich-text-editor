import { onMounted, onUnmounted } from "vue";
import { useEditorStore } from "@/stores/editorStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { useTableStore } from "@/stores/tableStore";

export function useEditor() {
  const editorStore = useEditorStore();
  const toolbarStore = useToolbarStore();
  const tableStore = useTableStore();

  let autosaveInterval: number | null = null;

  const handleClickOutside = (event: Event) => {
    // Handle outside clicks for dropdowns
    const target = event.target as Element;
    if (!target.closest(".dropdown-trigger")) {
      toolbarStore.closeAllDropdowns();
    }

    if (!target.closest(".context-menu")) {
      editorStore.showContextMenu = false;
    }
  };

  const handleSelectionChange = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;

    let node =
      sel.anchorNode.nodeType === Node.TEXT_NODE
        ? sel.anchorNode.parentElement
        : sel.anchorNode;

    if (!node || !editorStore.editorElement) return;

    if (editorStore.editorElement.contains(node as Node)) {
      editorStore.updateToolbarState();
      toolbarStore.updateHeadingState();
      tableStore.checkTableCellState();
      setTimeout(() => editorStore.showFloatingToolbar(), 10);
    } else {
      editorStore.showContextMenu = false;
    }
  };

  const startAutosave = (interval: number = 15000) => {
    if (autosaveInterval) return;

    autosaveInterval = window.setInterval(() => {
      if (editorStore.editorElement) {
        localStorage.setItem("richeditor_autosave", editorStore.content);
      }
    }, interval);
  };

  const stopAutosave = () => {
    if (autosaveInterval) {
      clearInterval(autosaveInterval);
      autosaveInterval = null;
    }
  };

  onMounted(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("click", handleClickOutside);
    startAutosave();
  });

  onUnmounted(() => {
    document.removeEventListener("selectionchange", handleSelectionChange);
    document.removeEventListener("click", handleClickOutside);
    stopAutosave();
  });

  return {
    editorStore,
    toolbarStore,
    tableStore,
    startAutosave,
    stopAutosave,
  };
}
