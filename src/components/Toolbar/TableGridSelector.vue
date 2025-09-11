<template>
  <DropdownMenu v-model:open="toolbarStore.dropdowns.tableGrid">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="sm" title="Insert Table">
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
import { useTableStore } from "@/stores/tableStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { useEditorStore } from "@/stores/editorStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Table as TableIcon, ChevronDown, Plus } from "lucide-vue-next";

const tableStore = useTableStore();
const toolbarStore = useToolbarStore();
const editorStore = useEditorStore();

const createTableFromGrid = (rows: number, cols: number) => {
  if (!rows || !cols) return;

  editorStore.restoreSelection();

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

  try {
    const success = document.execCommand("insertHTML", false, html);
    if (!success && editorStore.savedSelection) {
      insertTableAtSelection(html);
    }
  } catch (error) {
    if (editorStore.savedSelection) {
      insertTableAtSelection(html);
    }
  }

  toolbarStore.closeAllDropdowns();
  editorStore.savedSelection = null;
};

const insertTableAtSelection = (tableHTML: string) => {
  if (!editorStore.savedSelection || !editorStore.editorElement) return;

  try {
    editorStore.editorElement.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(editorStore.savedSelection);

    const temp = document.createElement("div");
    temp.innerHTML = tableHTML;

    const range = editorStore.savedSelection.cloneRange();
    range.deleteContents();

    const nodes = Array.from(temp.childNodes);
    nodes.forEach((node) => {
      range.insertNode(node.cloneNode(true));
      range.collapse(false);
    });

    selection?.removeAllRanges();
    selection?.addRange(range);
  } catch (error) {
    if (editorStore.editorElement) {
      editorStore.editorElement.innerHTML += tableHTML;
    }
  }
};

const showCustomTableDialog = () => {
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
