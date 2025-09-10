import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { DropdownState, ToolName } from "../types";
import {
  execCommand,
  isCommandActive,
  isCommandEnabled,
} from "../utils/commands";
import { escapeHtml, escapeHtmlAttr } from "../utils/sanitizer";
import {
  getSelectedText,
  restoreSelection,
  saveSelection,
} from "../utils/selection";
import {
  changeTableHeaderColor,
  createTable,
  deleteTableColumn,
  deleteTableRow,
  insertTableColumn,
  insertTableRow,
  toggleTableHeader,
} from "../utils/tableOperations";

export const useEditorStore = defineStore("editor", () => {
  // Core state
  const tools = ref<ToolName[]>([
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
  ]);

  const content = ref("");
  const isFocused = ref(false);
  const isCodeView = ref(false);
  const isFullscreen = ref(false);
  const canUndo = ref(false);
  const canRedo = ref(false);
  const currentHeading = ref("Paragraph");
  const currentTextColor = ref("#000000");
  const currentHighlightColor = ref("#ffff00");
  const currentTableHeaderColor = ref("#f0f0f0");
  const isInTableCell = ref(false);

  // Context menu state
  const showContextMenu = ref(false);
  const contextMenuStyle = ref<Record<string, string>>({});
  const savedSelection = ref<Range | null>(null);

  // Dropdown states
  const dropdowns = ref({
    heading: false,
    color: false,
    highlight: false,
    tableHeaderColor: false,
    tableGrid: false,
  });

  // Grid state for table creation
  const maxGridRows = ref(5);
  const maxGridCols = ref(5);
  const hoveredRows = ref(1);
  const hoveredCols = ref(1);

  // Selected tools configuration
  const selectedTools = ref<ToolName[]>([]);

  // Editor refs (will be set from component)
  const editorAreaRef = ref<any>(null);

  // Computed properties
  const wordCount = computed(() => {
    const text = stripHtml(content.value).trim();
    return text ? text.split(/\s+/).length : 0;
  });

  const characterCount = computed(() => {
    const text = stripHtml(content.value);
    return text.length;
  });

  const getTools = computed(() => {
    if (tools.value) return tools.value;
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
    ] as ToolName[];
  });

  const activeStates = computed(() => {
    const states: Record<string, boolean> = {};

    if (isCodeView.value) return states;

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

  // Helper function
  function stripHtml(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  // Basic setters
  const setTools = (t: ToolName[]) => {
    tools.value = t;
  };

  const setContent = (val: string) => {
    content.value = val;
  };

  const setFocused = (flag: boolean) => {
    isFocused.value = flag;
  };

  const toggleCodeView = () => {
    isCodeView.value = !isCodeView.value;
  };

  const setCanUndo = (flag: boolean) => {
    canUndo.value = flag;
  };

  const setCanRedo = (flag: boolean) => {
    canRedo.value = flag;
  };

  const setCurrentHeading = (heading: string) => {
    currentHeading.value = heading;
  };

  const setCurrentTextColor = (color: string) => {
    currentTextColor.value = color;
  };

  const setCurrentHighlightColor = (color: string) => {
    currentHighlightColor.value = color;
  };

  const setCurrentTableHeaderColor = (color: string) => {
    currentTableHeaderColor.value = color;
  };

  const setInTableCell = (flag: boolean) => {
    isInTableCell.value = flag;
  };

  const setEditorAreaRef = (ref: any) => {
    editorAreaRef.value = ref;
  };

  // Dropdown methods
  function toggleDropdown(name: keyof DropdownState) {
    Object.keys(dropdowns.value).forEach((key) => {
      dropdowns.value[key as keyof DropdownState] = false;
    });
    dropdowns.value[name] = !dropdowns.value[name];
  }

  function closeAllDropdowns() {
    Object.keys(dropdowns.value).forEach((key) => {
      dropdowns.value[key as keyof DropdownState] = false;
    });
  }

  function setGridSize(rows: number, cols: number) {
    maxGridRows.value = rows;
    maxGridCols.value = cols;
  }

  function setGridHover(rows: number, cols: number) {
    hoveredRows.value = rows;
    hoveredCols.value = cols;
  }

  function setSelectedTools(tools: ToolName[]) {
    selectedTools.value = tools;
  }

  // Business logic methods
  const updateContent = (emit: Function) => {
    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    const newContent = isCodeView.value
      ? editable.textContent || ""
      : editable.innerHTML;

    content.value = newContent;
    emit("update:modelValue", newContent);
    emit("change", newContent);
  };

  const updateToolbarState = () => {
    try {
      canUndo.value = isCommandEnabled("undo");
      canRedo.value = isCommandEnabled("redo");
    } catch {
      canUndo.value = false;
      canRedo.value = false;
    }

    updateHeadingState();
    checkTableCellState();
  };

  const updateHeadingState = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      currentHeading.value = "Paragraph";
      return;
    }

    let node = sel.anchorNode;
    if (!node) {
      currentHeading.value = "Paragraph";
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    const editable = editorAreaRef.value?.editable;
    while (node && node !== editable) {
      if (node instanceof HTMLElement) {
        const tag = node.tagName?.toLowerCase();
        if (
          tag &&
          tag.startsWith("h") &&
          tag.length === 2 &&
          /\d/.test(tag[1])
        ) {
          currentHeading.value = `Heading ${tag[1]}`;
          return;
        }
      }
      node = node.parentElement;
    }
    currentHeading.value = "Paragraph";
  };

  const checkTableCellState = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      isInTableCell.value = false;
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

    isInTableCell.value = inTable;
  };

  // Command handlers
  const handleExecCommand = (
    command: string,
    value?: string,
    emit?: Function
  ) => {
    if (isCodeView.value && !["undo", "redo"].includes(command)) return;

    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    if (command === "insertHTML" || command === "insertText") {
      editable.focus();
    }

    const success = execCommand(command, value || null);
    if (success && emit) {
      updateContent(emit);
      updateToolbarState();
    }
  };

  const handleChangeHeading = (level: string, emit?: Function) => {
    if (isCodeView.value) return;

    if (level === "paragraph") {
      handleExecCommand("formatBlock", "<p>", emit);
    } else {
      handleExecCommand("formatBlock", `<${level}>`, emit);
    }
    closeAllDropdowns();
  };

  const handleChangeTextColor = (color: string, emit?: Function) => {
    currentTextColor.value = color;
    handleExecCommand("foreColor", color, emit);
    closeAllDropdowns();
  };

  const handleApplyHighlight = (color: string, emit?: Function) => {
    if (isCodeView.value) return;

    if (color === "transparent") {
      handleExecCommand("hiliteColor", "transparent", emit);
      handleExecCommand("backColor", "transparent", emit);
    } else {
      handleExecCommand("hiliteColor", color, emit);
      if (!document.queryCommandSupported("hiliteColor")) {
        handleExecCommand("backColor", color, emit);
      }
    }

    currentHighlightColor.value = color;
    closeAllDropdowns();
  };

  const handleInsertLink = (emit?: Function) => {
    const selText = getSelectedText();
    const url = prompt("Enter URL", "https://");
    if (!url) return;

    if (selText) {
      handleExecCommand("createLink", url, emit);
    } else {
      const text = prompt("Link text", url) || url;
      handleExecCommand(
        "insertHTML",
        `<a href="${escapeHtmlAttr(
          url
        )}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`,
        emit
      );
    }
    updateToolbarState();
  };

  const handleToggleCodeView = (emit?: Function) => {
    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    toggleCodeView();

    if (isCodeView.value) {
      editable.textContent = editable.innerHTML;
    } else {
      editable.innerHTML = editable.textContent || "<p></p>";
    }

    if (emit) {
      updateContent(emit);
      updateToolbarState();
    }
  };

  // Table handlers
  const handleInsertTableRow = (
    position: "above" | "below",
    emit?: Function
  ) => {
    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    insertTableRow(editable, position, currentTableHeaderColor.value);
    closeAllDropdowns();
    if (emit) updateContent(emit);
  };

  const handleDeleteTableRow = (emit?: Function) => {
    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    deleteTableRow(editable);
    closeAllDropdowns();
    if (emit) updateContent(emit);
  };

  const handleInsertTableColumn = (
    position: "left" | "right",
    emit?: Function
  ) => {
    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    insertTableColumn(editable, position, currentTableHeaderColor.value);
    closeAllDropdowns();
    if (emit) updateContent(emit);
  };

  const handleDeleteTableColumn = (emit?: Function) => {
    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    deleteTableColumn(editable);
    closeAllDropdowns();
    if (emit) updateContent(emit);
  };

  const handleChangeTableHeaderColor = (color: string, emit?: Function) => {
    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    currentTableHeaderColor.value = color;
    changeTableHeaderColor(editable, color);
    closeAllDropdowns();
    if (emit) updateContent(emit);
  };

  const handleToggleTableHeader = (emit?: Function) => {
    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    toggleTableHeader(editable, currentTableHeaderColor.value);
    closeAllDropdowns();
    if (emit) updateContent(emit);
    updateToolbarState();
  };

  const handleCreateTableFromGrid = (
    rows: number,
    cols: number,
    emit?: Function
  ) => {
    const editable = editorAreaRef.value?.editable;
    if (!editable) return;

    savedSelection.value = saveSelection(editable);

    const tableHtml = createTable(rows, cols, currentTableHeaderColor.value);

    if (savedSelection.value) {
      restoreSelection(savedSelection.value);
    }

    const success = execCommand("insertHTML", tableHtml);

    if (!success && savedSelection.value) {
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

    closeAllDropdowns();
    if (emit) {
      updateContent(emit);
      updateToolbarState();
    }
    savedSelection.value = null;
  };

  const handleShowCustomTableDialog = (emit?: Function) => {
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

    handleCreateTableFromGrid(rows, cols, emit);
  };

  // Context menu methods
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

  const hideContextMenu = () => {
    showContextMenu.value = false;
  };

  return {
    // State
    tools,
    content,
    isFocused,
    isCodeView,
    isFullscreen,
    canUndo,
    canRedo,
    currentHeading,
    currentTextColor,
    currentHighlightColor,
    currentTableHeaderColor,
    isInTableCell,
    dropdowns,
    maxGridRows,
    maxGridCols,
    hoveredRows,
    hoveredCols,
    selectedTools,
    showContextMenu,
    contextMenuStyle,
    savedSelection,
    editorAreaRef,

    // Computed
    getTools,
    wordCount,
    characterCount,
    activeStates,

    // Basic setters
    setTools,
    setContent,
    setFocused,
    toggleCodeView,
    setCanUndo,
    setCanRedo,
    setCurrentHeading,
    setCurrentTextColor,
    setCurrentHighlightColor,
    setCurrentTableHeaderColor,
    setInTableCell,
    setEditorAreaRef,

    // Methods
    toggleDropdown,
    closeAllDropdowns,
    setGridSize,
    setGridHover,
    setSelectedTools,
    updateContent,
    updateToolbarState,
    updateHeadingState,
    checkTableCellState,
    showFloatingToolbar,
    hideContextMenu,

    // Command handlers
    handleExecCommand,
    handleChangeHeading,
    handleChangeTextColor,
    handleApplyHighlight,
    handleInsertLink,
    handleToggleCodeView,
    handleInsertTableRow,
    handleDeleteTableRow,
    handleInsertTableColumn,
    handleDeleteTableColumn,
    handleChangeTableHeaderColor,
    handleToggleTableHeader,
    handleCreateTableFromGrid,
    handleShowCustomTableDialog,
  };
});
