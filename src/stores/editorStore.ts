import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { DropdownState, ToolName } from "../types";

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

  // Dropdown states
  const dropdowns = ref<DropdownState>({
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
    if (tools) return tools;

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

  // Helper function
  function stripHtml(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  // setter

  const setTools = (t: ToolName[]) => {
    tools.value = t;
  };

  // Actions
  function setContent(val: string) {
    content.value = val;
  }

  function setFocused(flag: boolean) {
    isFocused.value = flag;
  }

  function toggleCodeView() {
    isCodeView.value = !isCodeView.value;
  }

  function setCanUndo(flag: boolean) {
    canUndo.value = flag;
  }

  function setCanRedo(flag: boolean) {
    canRedo.value = flag;
  }

  function setCurrentHeading(heading: string) {
    currentHeading.value = heading;
  }

  function setCurrentTextColor(color: string) {
    currentTextColor.value = color;
  }

  function setCurrentHighlightColor(color: string) {
    currentHighlightColor.value = color;
  }

  function setCurrentTableHeaderColor(color: string) {
    currentTableHeaderColor.value = color;
  }

  function setInTableCell(flag: boolean) {
    isInTableCell.value = flag;
  }

  function toggleDropdown(name: keyof DropdownState) {
    // Close all dropdowns first
    Object.keys(dropdowns.value).forEach((key) => {
      dropdowns.value[key as keyof DropdownState] = false;
    });
    // Toggle the requested one
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

    // Computed
    getTools,
    wordCount,
    characterCount,

    // setters
    setTools,

    // Actions
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
    toggleDropdown,
    closeAllDropdowns,
    setGridSize,
    setGridHover,
    setSelectedTools,
  };
});
