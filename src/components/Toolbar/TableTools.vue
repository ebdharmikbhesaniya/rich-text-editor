<template>
  <DropdownMenu
    v-show="tableStore.isInTableCell"
    v-model:open="toolbarStore.dropdowns.tableHeaderColor">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="sm" title="Table Options">
        <Table class="h-4 w-4" />
        <ChevronDown class="h-3 w-3 ml-1" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-64 p-3">
      <!-- Row Operations -->
      <div class="mb-4">
        <h4 class="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b">
          Rows
        </h4>
        <div class="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start text-xs"
            @mousedown.prevent="() => insertTableRow('above')">
            <Plus class="h-3 w-3 mr-2" />
            Insert Above
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start text-xs"
            @mousedown.prevent="() => insertTableRow('below')">
            <Plus class="h-3 w-3 mr-2" />
            Insert Below
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            @mousedown.prevent="deleteTableRow">
            <Trash class="h-3 w-3 mr-2" />
            Delete Row
          </Button>
        </div>
      </div>

      <!-- Column Operations -->
      <div class="mb-4">
        <h4 class="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b">
          Columns
        </h4>
        <div class="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start text-xs"
            @mousedown.prevent="() => insertTableColumn('left')">
            <Plus class="h-3 w-3 mr-2" />
            Insert Left
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start text-xs"
            @mousedown.prevent="() => insertTableColumn('right')">
            <Plus class="h-3 w-3 mr-2" />
            Insert Right
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            @mousedown.prevent="deleteTableColumn">
            <Trash class="h-3 w-3 mr-2" />
            Delete Column
          </Button>
        </div>
      </div>

      <!-- Cell Background Colors -->
      <div class="mb-4">
        <h4 class="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b">
          Cell Color
        </h4>
        <div class="grid grid-cols-10 gap-1">
          <button
            v-for="color in tableStore.headerColorPalette"
            :key="color"
            class="w-5 h-5 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
            :style="{ backgroundColor: color }"
            @mousedown.prevent="changeTableHeaderColor(color)"
            :title="color" />
        </div>
      </div>

      <!-- Header Toggle -->
      <div>
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-start text-xs"
          @mousedown.prevent="toggleTableHeader">
          <ArrowUpDown class="h-3 w-3 mr-2" />
          Toggle Header/Cell
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
import { Table, ChevronDown, Plus, Trash, ArrowUpDown } from "lucide-vue-next";

const tableStore = useTableStore();
const toolbarStore = useToolbarStore();
const editorStore = useEditorStore();

const insertTableRow = (position: "above" | "below" = "below") => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editorStore.editorElement) {
    if ((node as Element).tagName === "TR") {
      const currentRow = node as HTMLTableRowElement;
      const cellCount = currentRow.children.length;
      const newRow = document.createElement("tr");

      for (let i = 0; i < cellCount; i++) {
        const originalCell = currentRow.children[i] as HTMLElement;
        const isHeader = originalCell.tagName === "TH";
        const cell = document.createElement(isHeader ? "th" : "td");

        if (isHeader) {
          cell.style.cssText = `
              border: 1px solid #ccc;
              padding: 8px;
              word-wrap: break-word;
              overflow-wrap: break-word;
              vertical-align: top;
              min-height: 20px;
              background-color: ${tableStore.currentHeaderColor};
              font-weight: bold;
              text-align: center;
            `;
          cell.innerHTML = "Header";
        } else {
          cell.style.cssText = `
              border: 1px solid #ccc;
              padding: 8px;
              word-wrap: break-word;
              overflow-wrap: break-word;
              vertical-align: top;
              min-height: 20px;
            `;
          cell.innerHTML = "&nbsp;";
        }
        newRow.appendChild(cell);
      }

      const tbody = currentRow.parentNode!;
      if (position === "above") {
        tbody.insertBefore(newRow, currentRow);
      } else {
        if (currentRow.nextSibling) {
          tbody.insertBefore(newRow, currentRow.nextSibling);
        } else {
          tbody.appendChild(newRow);
        }
      }

      toolbarStore.closeAllDropdowns();
      break;
    }
    node = (node as Element).parentElement;
  }
};

const deleteTableRow = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editorStore.editorElement) {
    if ((node as Element).tagName === "TR") {
      const currentRow = node as HTMLTableRowElement;
      const tbody = currentRow.parentNode!;

      if (tbody.children.length <= 1) {
        alert("Cannot delete the last row");
        return;
      }

      currentRow.remove();
      toolbarStore.closeAllDropdowns();
      break;
    }
    node = (node as Element).parentElement;
  }
};

const insertTableColumn = (position: "left" | "right" = "right") => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editorStore.editorElement) {
    if (
      (node as Element).tagName === "TD" ||
      (node as Element).tagName === "TH"
    ) {
      const table = (node as Element).closest("table")!;
      const currentCell = node as HTMLElement;
      const currentRow = currentCell.parentNode as HTMLElement;

      const cells = Array.from(currentRow.children);
      const cellIndex = cells.indexOf(currentCell);
      const insertIndex = position === "left" ? cellIndex : cellIndex + 1;

      const allRows = Array.from(table.querySelectorAll("tr"));

      allRows.forEach((row, rowIndex) => {
        const isFirstRow = rowIndex === 0;
        const existingCells = Array.from(row.children);
        const newCell = document.createElement(isFirstRow ? "th" : "td");

        if (isFirstRow) {
          newCell.style.cssText = `
              border: 1px solid #ccc;
              padding: 8px;
              word-wrap: break-word;
              overflow-wrap: break-word;
              vertical-align: top;
              min-height: 20px;
              background-color: ${tableStore.currentHeaderColor};
              font-weight: bold;
              text-align: center;
            `;
          newCell.innerHTML = "Header";
        } else {
          newCell.style.cssText = `
              border: 1px solid #ccc;
              padding: 8px;
              word-wrap: break-word;
              overflow-wrap: break-word;
              vertical-align: top;
              min-height: 20px;
            `;
          newCell.innerHTML = "&nbsp;";
        }

        if (insertIndex >= existingCells.length) {
          row.appendChild(newCell);
        } else {
          row.insertBefore(newCell, existingCells[insertIndex]);
        }
      });

      toolbarStore.closeAllDropdowns();
      break;
    }
    node = (node as Element).parentElement;
  }
};

const deleteTableColumn = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editorStore.editorElement) {
    if (
      (node as Element).tagName === "TD" ||
      (node as Element).tagName === "TH"
    ) {
      const table = (node as Element).closest("table")!;
      const currentCell = node as HTMLElement;
      const currentRow = currentCell.parentNode as HTMLElement;

      const firstRow = table.querySelector("tr")!;
      if (firstRow.children.length <= 1) {
        alert("Cannot delete the last column");
        return;
      }

      const cells = Array.from(currentRow.children);
      const cellIndex = cells.indexOf(currentCell);

      const allRows = Array.from(table.querySelectorAll("tr"));
      allRows.forEach((row) => {
        const cellsInRow = Array.from(row.children);
        if (cellsInRow[cellIndex]) {
          cellsInRow[cellIndex].remove();
        }
      });

      toolbarStore.closeAllDropdowns();
      break;
    }
    node = (node as Element).parentElement;
  }
};

const changeTableHeaderColor = (color: string) => {
  tableStore.currentHeaderColor = color;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editorStore.editorElement) {
    if (
      (node as Element).tagName === "TH" ||
      (node as Element).tagName === "TD"
    ) {
      (node as HTMLElement).style.backgroundColor = color;
      break;
    }
    node = (node as Element).parentElement;
  }

  toolbarStore.closeAllDropdowns();
};

const toggleTableHeader = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editorStore.editorElement) {
    if (
      (node as Element).tagName === "TH" ||
      (node as Element).tagName === "TD"
    ) {
      const currentElement = node as HTMLElement;
      const isHeader = currentElement.tagName === "TH";
      const newTagName = isHeader ? "TD" : "TH";

      const newElement = document.createElement(newTagName);
      newElement.innerHTML = currentElement.innerHTML;

      for (let i = 0; i < currentElement.attributes.length; i++) {
        const attr = currentElement.attributes[i];
        newElement.setAttribute(attr.name, attr.value);
      }

      if (newTagName === "TH") {
        newElement.style.backgroundColor = tableStore.currentHeaderColor;
        newElement.style.fontWeight = "bold";
        newElement.style.textAlign = "center";
      } else {
        newElement.style.fontWeight = "normal";
        newElement.style.textAlign = "left";
      }

      currentElement.parentElement!.replaceChild(newElement, currentElement);

      const range = document.createRange();
      range.selectNodeContents(newElement);
      sel.removeAllRanges();
      sel.addRange(range);

      break;
    }
    node = (node as Element).parentElement;
  }

  toolbarStore.closeAllDropdowns();
};
</script>
