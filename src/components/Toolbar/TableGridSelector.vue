<template>
  <DropdownMenu v-model:open="toolbarStore.dropdowns.tableGrid">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        title="Insert Table"
        @mousedown="(e: any) => handleDropdownToggle(e)">
        <TableIcon class="h-4 w-4" />
        <ChevronDown class="h-3 w-3 ml-1" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-72 p-3">
      <!-- Table Size Indicator -->
      <div class="text-center mb-3">
        <span
          class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
          {{ tableStore.tableSize }} table
        </span>
      </div>

      <!-- Visual Grid Selector -->
      <div
        class="grid-selector p-2 bg-gray-50 rounded border"
        @mouseleave="tableStore.resetGridHover">
        <div class="grid-container space-y-0.5">
          <div
            v-for="row in tableStore.maxGridRows"
            :key="`row-${row}`"
            class="grid-row flex gap-0.5"
            :class="{
              'opacity-60 scale-95': row > tableStore.hoveredRows + 3,
            }">
            <div
              v-for="col in tableStore.maxGridCols"
              :key="`cell-${row}-${col}`"
              class="grid-cell w-4 h-3 border border-gray-300 bg-white cursor-pointer transition-all duration-150"
              :class="{
                'bg-blue-200 border-blue-500':
                  row <= tableStore.hoveredRows &&
                  col <= tableStore.hoveredCols,
                'opacity-40 scale-95':
                  row > tableStore.hoveredRows + 4 ||
                  col > tableStore.hoveredCols + 4,
                'hover:border-blue-400 hover:scale-105': true,
              }"
              @mouseenter="() => tableStore.updateGridHover(row, col)"
              @click.stop.prevent="() => createTableFromGrid(row, col)" />
          </div>
        </div>
      </div>

      <!-- Custom Table Button -->
      <div class="mt-3 pt-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-start text-xs text-blue-600"
          @mousedown.prevent="showCustomTableDialog">
          <Plus class="h-3 w-3 mr-2" />
          Insert custom table...
        </Button>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditorStore } from "@/stores/editorStore";
import { useTableStore } from "@/stores/tableStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { ChevronDown, Plus, Table as TableIcon } from "lucide-vue-next";
import { ref } from "vue";

const tableStore = useTableStore();
const toolbarStore = useToolbarStore();
const editorStore = useEditorStore();

// FIXED: Store the original cursor position when dropdown opens
const originalCursorPosition = ref<Range | null>(null);

// FIXED: Save cursor position BEFORE opening dropdown
const handleDropdownToggle = (event: MouseEvent) => {
  event.preventDefault();

  // Save the current cursor position in the editor
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && editorStore.editorElement) {
    const range = selection.getRangeAt(0);

    // Check if the selection is within the editor
    const isInEditor =
      editorStore.editorElement.contains(
        range.commonAncestorContainer as Node
      ) || editorStore.editorElement === range.commonAncestorContainer;

    if (isInEditor) {
      // Save the exact cursor position
      originalCursorPosition.value = range.cloneRange();
      console.log("Saved cursor position in editor");
    } else {
      // Cursor is outside editor, create position at end
      originalCursorPosition.value = createEndPosition();
      console.log("Cursor outside editor, created end position");
    }
  } else {
    // No selection, create position at end of editor
    originalCursorPosition.value = createEndPosition();
    console.log("No selection, created end position");
  }

  // Open the dropdown
  toolbarStore.toggleDropdown("tableGrid");
};

// FIXED: Create a position at the end of editor content
const createEndPosition = (): Range | null => {
  if (!editorStore.editorElement) return null;

  const range = document.createRange();

  if (editorStore.editorElement.childNodes.length > 0) {
    const lastChild = editorStore.editorElement.lastChild!;

    if (lastChild.nodeType === Node.TEXT_NODE) {
      range.setStart(lastChild, (lastChild.textContent || "").length);
      range.setEnd(lastChild, (lastChild.textContent || "").length);
    } else if (lastChild.nodeName === "P" || lastChild.nodeName === "DIV") {
      // Place cursor at end of last paragraph/div
      if (lastChild.childNodes.length > 0) {
        const lastTextNode = lastChild.lastChild!;
        if (lastTextNode.nodeType === Node.TEXT_NODE) {
          range.setStart(lastTextNode, (lastTextNode.textContent || "").length);
          range.setEnd(lastTextNode, (lastTextNode.textContent || "").length);
        } else {
          range.setStartAfter(lastTextNode);
          range.setEndAfter(lastTextNode);
        }
      } else {
        range.setStart(lastChild, 0);
        range.setEnd(lastChild, 0);
      }
    } else {
      range.setStartAfter(lastChild);
      range.setEndAfter(lastChild);
    }
  } else {
    // Editor is empty, create a paragraph
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    editorStore.editorElement.appendChild(p);
    range.setStart(p, 0);
    range.setEnd(p, 0);
  }

  return range;
};

// FIXED: Use the saved cursor position for table insertion
const createTableFromGrid = (rows: number, cols: number) => {
  if (
    !rows ||
    !cols ||
    !originalCursorPosition.value ||
    !editorStore.editorElement
  )
    return;

  console.log("Inserting table at saved cursor position");

  // Focus the editor first
  editorStore.editorElement.focus();

  // Restore the original cursor position
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(originalCursorPosition.value);
  }

  // Create table HTML
  // In createTableFromGrid function, replace the table HTML generation:
  const columnWidth = Math.floor(100 / cols);
  let html = `<table style="
    table-layout: fixed;
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
  ">`;

  html += "<colgroup>";
  for (let c = 0; c < cols; c++) {
    html += `<col style="width: ${columnWidth}%;">`;
  }
  html += "</colgroup>";

  for (let r = 0; r < rows; r++) {
    html += "<tr>";
    const isFirstRow = r === 0;

    for (let c = 0; c < cols; c++) {
      if (isFirstRow) {
        html += `<th style="
          border: 1px solid #ccc;
          padding: 8px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          vertical-align: top;
          min-height: 20px;
          max-width: 1px;
          background-color: ${tableStore.currentHeaderColor};
          font-weight: bold;
          text-align: center;
          overflow: hidden;
        ">Header</th>`;
      } else {
        html += `<td style="
          border: 1px solid #ccc;
          padding: 8px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          vertical-align: top;
          min-height: 20px;
          max-width: 1px;
          overflow: hidden;
        ">&nbsp;</td>`;
      }
    }
    html += "</tr>";
  }

  html += "</table><p></p>";

  // Insert the table at the restored cursor position
  setTimeout(() => {
    try {
      const success = document.execCommand("insertHTML", false, html);
      if (!success) {
        console.warn("execCommand failed, trying fallback");
        insertTableAtSavedPosition(html);
      } else {
        console.log("Table inserted successfully with execCommand");
      }
    } catch (error) {
      console.error("execCommand error:", error);
      insertTableAtSavedPosition(html);
    }

    // Update editor content and close dropdown
    editorStore.updateToolbarState();
    toolbarStore.closeAllDropdowns();

    // Clear the saved position
    originalCursorPosition.value = null;
  }, 10);
};

// FIXED: Fallback method using saved position
const insertTableAtSavedPosition = (tableHTML: string) => {
  if (!originalCursorPosition.value || !editorStore.editorElement) return;

  try {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(originalCursorPosition.value);
    }

    const temp = document.createElement("div");
    temp.innerHTML = tableHTML;

    const range = originalCursorPosition.value.cloneRange();
    range.deleteContents();

    const nodes = Array.from(temp.childNodes);
    nodes.forEach((node) => {
      range.insertNode(node.cloneNode(true));
      range.collapse(false);
    });

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    console.log("Table inserted using fallback method");
  } catch (error) {
    console.error("Fallback insertion failed:", error);
    // Last resort - append to end
    editorStore.editorElement.innerHTML += tableHTML;
  }
};

// FIXED: Custom table dialog using saved position
const showCustomTableDialog = () => {
  // Use the same saved cursor position
  if (!originalCursorPosition.value) {
    // If no saved position, create one
    originalCursorPosition.value = createEndPosition();
  }

  const rowsInput = prompt("Number of rows:", "3");
  if (rowsInput === null) return;

  const rows = parseInt(rowsInput, 10);
  if (!rows || rows < 1) return;

  const colsInput = prompt("Number of columns:", "3");
  if (colsInput === null) return;

  const cols = parseInt(colsInput, 10);
  if (!cols || cols < 1) return;

  createTableFromGrid(rows, cols);
};
</script>
