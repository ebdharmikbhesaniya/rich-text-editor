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
              class="grid-cell w-4 h-3 border border-gray-300 bg-white cursor-pointer transition-all duration-150 rounded-sm"
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

const tableStore = useTableStore();
const toolbarStore = useToolbarStore();
const editorStore = useEditorStore();

// FIXED: Handle dropdown toggle with proper selection saving
const handleDropdownToggle = (event: MouseEvent) => {
  event.preventDefault();

  // Always ensure we have a valid cursor position before opening dropdown
  ensureValidCursorPosition();

  // Save selection after ensuring cursor is in editor
  editorStore.saveSelection();
  toolbarStore.toggleDropdown("tableGrid");
};

// FIXED: Ensure cursor is in editor before table operations
const ensureValidCursorPosition = () => {
  if (!editorStore.editorElement) return;

  const selection = window.getSelection();
  const isInEditor =
    selection &&
    selection.rangeCount > 0 &&
    editorStore.editorElement.contains(selection.anchorNode as Node);

  if (!isInEditor) {
    // Place cursor at the end of editor
    editorStore.editorElement.focus();

    const range = document.createRange();

    // Find the best place to put cursor
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
            range.setStart(
              lastTextNode,
              (lastTextNode.textContent || "").length
            );
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

    selection?.removeAllRanges();
    selection?.addRange(range);
  }
};

// FIXED: Improved table creation with proper cursor management
const createTableFromGrid = (rows: number, cols: number) => {
  if (!rows || !cols) return;

  // Ensure we have a valid cursor position
  ensureValidCursorPosition();

  // Use maintainFocus to handle the entire operation
  editorStore.maintainFocus(() => {
    const columnWidth = Math.floor(100 / cols);
    let html = `<table style="
        border-collapse: collapse;
        width: 100%;
        table-layout: fixed;
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
              vertical-align: top;
              min-height: 20px;
              background-color: ${tableStore.currentHeaderColor};
              font-weight: bold;
              text-align: center;
            ">Header</th>`;
        } else {
          html += `<td style="
              border: 1px solid #ccc;
              padding: 8px;
              word-wrap: break-word;
              overflow-wrap: break-word;
              vertical-align: top;
              min-height: 20px;
            ">&nbsp;</td>`;
        }
      }
      html += "</tr>";
    }

    html += "</table><p></p>";

    // Insert table using execCommand
    const success = insertTableHTML(html);

    if (!success) {
      console.warn("Table insertion failed, trying fallback method");
      insertTableFallback(html);
    }
  });

  toolbarStore.closeAllDropdowns();
};

// FIXED: Better table HTML insertion
const insertTableHTML = (html: string): boolean => {
  try {
    return document.execCommand("insertHTML", false, html);
  } catch (error) {
    console.warn("execCommand insertHTML failed:", error);
    return false;
  }
};

// FIXED: Fallback table insertion method
const insertTableFallback = (tableHTML: string) => {
  if (!editorStore.editorElement) return;

  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // No selection, append to end
      const temp = document.createElement("div");
      temp.innerHTML = tableHTML;

      while (temp.firstChild) {
        editorStore.editorElement.appendChild(temp.firstChild);
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const temp = document.createElement("div");
    temp.innerHTML = tableHTML;

    // Delete any selected content first
    range.deleteContents();

    // Insert each child node
    const nodes = Array.from(temp.childNodes);
    nodes.forEach((node) => {
      range.insertNode(node.cloneNode(true));
      range.collapse(false); // Move cursor after inserted content
    });

    // Update selection
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    console.error("Fallback table insertion failed:", error);
    // Last resort - append to end
    editorStore.editorElement.innerHTML += tableHTML;
  }
};

// FIXED: Custom table dialog with proper cursor management
const showCustomTableDialog = () => {
  // Ensure cursor is in editor before showing dialog
  ensureValidCursorPosition();
  editorStore.saveSelection();

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
