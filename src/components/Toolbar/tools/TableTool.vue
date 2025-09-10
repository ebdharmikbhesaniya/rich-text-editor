<template>
    <div class="ck-toolbar__group">
        <!-- Table Operations Dropdown (only shown when in table cell) -->
        <div class="ck-dropdown" v-show="isInTableCell">
      <button
        class="ck-button"
        @mousedown.prevent="store.toggleDropdown('tableHeaderColor')"
        :class="{ 'ck-on': store.dropdowns.tableHeaderColor }"
        title="Table Options">
        <Table />
        <i
          class="fa fa-chevron-down"
          style="margin-left: 2px"
          aria-hidden="true"></i>
      </button>

      <div
        class="ck-dropdown__panel ck-table-panel"
        v-show="store.dropdowns.tableHeaderColor">
        <!-- Row Operations -->
        <div class="ck-table-section">
          <h4 class="ck-table-section-title">Rows</h4>
          <div class="ck-table-buttons">
            <button
              class="ck-button ck-button_with-text ck-table-btn"
              @mousedown.prevent="$emit('insertTableRow', 'above')">
              <i class="fa fa-plus" aria-hidden="true"></i> Insert Above
            </button>
            <button
              class="ck-button ck-button_with-text ck-table-btn"
              @mousedown.prevent="$emit('insertTableRow', 'below')">
              <i class="fa fa-plus" aria-hidden="true"></i> Insert Below
            </button>
            <button
              class="ck-button ck-button_with-text ck-table-btn ck-table-btn-danger"
              @mousedown.prevent="$emit('deleteTableRow')">
              <i class="fa fa-trash" aria-hidden="true"></i> Delete Row
            </button>
          </div>
        </div>

        <!-- Column Operations -->
        <div class="ck-table-section">
          <h4 class="ck-table-section-title">Columns</h4>
          <div class="ck-table-buttons">
            <button
              class="ck-button ck-button_with-text ck-table-btn"
              @mousedown.prevent="$emit('insertTableColumn', 'left')">
              <i class="fa fa-plus" aria-hidden="true"></i> Insert Left
            </button>
            <button
              class="ck-button ck-button_with-text ck-table-btn"
              @mousedown.prevent="$emit('insertTableColumn', 'right')">
              <i class="fa fa-plus" aria-hidden="true"></i> Insert Right
            </button>
            <button
              class="ck-button ck-button_with-text ck-table-btn ck-table-btn-danger"
              @mousedown.prevent="$emit('deleteTableColumn')">
              <i class="fa fa-trash" aria-hidden="true"></i> Delete Column
            </button>
          </div>
        </div>

        <!-- Cell Background Colors -->
        <div class="ck-table-section">
          <h4 class="ck-table-section-title">Cell Color</h4>
          <div class="ck-color-grid">
            <button
              v-for="color in headerColorPalette"
              :key="color"
              class="ck-color-grid__tile"
              :style="{ backgroundColor: color }"
              @mousedown.prevent="changeTableHeaderColor(color)"
              :title="color"></button>
          </div>
        </div>

        <!-- Header Toggle -->
        <div class="ck-table-section">
          <button
            class="ck-button ck-button_with-text ck-table-btn"
            @mousedown.prevent="$emit('toggleTableHeader')"
            style="width: 100%">
            <i class="fa fa-exchange-alt" aria-hidden="true"></i> Toggle
            Header/Cell
          </button>
        </div>
      </div>
    </div>

    <!-- Insert Table Dropdown -->
    <div class="ck-dropdown">
      <button
        class="ck-button"
        @mousedown.prevent="store.toggleDropdown('tableGrid')"
        :class="{ 'ck-on': store.dropdowns.tableGrid }"
        title="Insert Table">
        <i class="fa fa-plus-square" aria-hidden="true"></i>
        <i
          class="fa fa-chevron-down"
          style="margin-left: 2px"
          aria-hidden="true"></i>
      </button>

      <!-- Visual Grid Selector Panel -->
      <div
        class="ck-dropdown__panel ck-table-grid-panel"
        v-show="store.dropdowns.tableGrid">
        <div class="ck-table-grid-header">
          <span class="ck-table-grid-info">
            {{ store.hoveredRows }}×{{ store.hoveredCols }} table
          </span>
        </div>

        <div
          class="ck-table-grid ck-table-grid-dynamic"
          @mouseleave="resetGridHover">
          <div class="ck-table-grid-container">
            <div
              v-for="row in store.maxGridRows"
              :key="`row-${row}`"
              class="ck-table-grid-row"
              :class="{
                'ck-table-grid-row--shrinking': row > store.hoveredRows + 3,
              }">
              <div
                v-for="col in store.maxGridCols"
                :key="`cell-${row}-${col}`"
                class="ck-table-grid-cell"
                :class="{
                  'ck-table-grid-cell--hovered':
                    row <= store.hoveredRows && col <= store.hoveredCols,
                  'ck-table-grid-cell--fading': isFadingCell(row, col),
                }"
                @mouseenter="updateGridHover(row, col)"
                @click.stop.prevent="createTable(row, col)"></div>
            </div>
          </div>
        </div>

        <div class="ck-table-grid-footer">
          <button
            class="ck-button ck-button_with-text ck-table-grid-custom"
            @mousedown.prevent="$emit('showCustomTableDialog')">
            <i class="fa fa-plus" aria-hidden="true"></i>
            Insert custom table...
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Table } from "@iconoir/vue";
import { useEditorStore } from "../../../stores/editorStore";

const props = defineProps<{
  currentTableHeaderColor: string;
  isInTableCell: boolean;
}>();

const emit = defineEmits<{
  insertTableRow: [position: "above" | "below"];
  deleteTableRow: [];
  insertTableColumn: [position: "left" | "right"];
  deleteTableColumn: [];
  changeTableHeaderColor: [color: string];
  toggleTableHeader: [];
  createTableFromGrid: [rows: number, cols: number];
  showCustomTableDialog: [];
}>();

const store = useEditorStore();

const headerColorPalette = [
  "#f0f0f0",
  "#e3f2fd",
  "#f3e5f5",
  "#e8f5e8",
  "#fff3e0",
  "#ffebee",
  "#f1f8e9",
  "#e0f2f1",
  "#fce4ec",
  "#ffffff",
  "#333333",
  "#1976d2",
  "#7b1fa2",
  "#388e3c",
  "#f57c00",
  "#d32f2f",
  "#689f38",
  "#00796b",
  "#c2185b",
  "#000000",
];

const changeTableHeaderColor = (color: string) => {
  emit("changeTableHeaderColor", color);
  store.closeAllDropdowns();
};

const updateGridHover = (row: number, col: number) => {
  store.setGridHover(row, col);
  // Dynamic grid resizing logic here
  resizeGridDynamically(row, col);
};

const resetGridHover = () => {
  store.setGridHover(1, 1);
  // Reset grid to minimum size gradually
  setTimeout(() => {
    if (!store.dropdowns.tableGrid) {
      store.setGridSize(5, 5);
    }
  }, 300);
};

const createTable = (rows: number, cols: number) => {
  emit("createTableFromGrid", rows, cols);
  store.closeAllDropdowns();
};

const isFadingCell = (row: number, col: number): boolean => {
  return row > store.hoveredRows + 4 || col > store.hoveredCols + 4;
};

const resizeGridDynamically = (hoveredRow: number, hoveredCol: number) => {
  const config = {
    minSize: { rows: 5, cols: 5 },
    maxSize: { rows: 12, cols: 15 },
    expandThreshold: 2,
    shrinkThreshold: 2,
    expandStep: 2,
    shrinkStep: 2,
  };

  const currentRows = store.maxGridRows;
  const currentCols = store.maxGridCols;

  // Handle ROWS
  if (
    hoveredRow >= currentRows - config.expandThreshold &&
    currentRows < config.maxSize.rows
  ) {
    const newRowCount = Math.min(
      currentRows + config.expandStep,
      config.maxSize.rows
    );
    if (newRowCount > currentRows) {
      store.setGridSize(newRowCount, currentCols);
    }
  } else if (
    hoveredRow < currentRows - config.shrinkThreshold &&
    currentRows > config.minSize.rows
  ) {
    const newRowCount = Math.max(
      Math.max(hoveredRow + config.shrinkThreshold, config.minSize.rows),
      currentRows - config.shrinkStep
    );
    if (newRowCount < currentRows) {
      store.setGridSize(newRowCount, currentCols);
    }
  }

  // Handle COLUMNS
  if (
    hoveredCol >= currentCols - config.expandThreshold &&
    currentCols < config.maxSize.cols
  ) {
    const newColCount = Math.min(
      currentCols + config.expandStep,
      config.maxSize.cols
    );
    if (newColCount > currentCols) {
      store.setGridSize(currentRows, newColCount);
    }
  } else if (
    hoveredCol < currentCols - config.shrinkThreshold &&
    currentCols > config.minSize.cols
  ) {
    const newColCount = Math.max(
      Math.max(hoveredCol + config.shrinkThreshold, config.minSize.cols),
      currentCols - config.shrinkStep
    );
    if (newColCount < currentCols) {
      store.setGridSize(currentRows, newColCount);
    }
  }
};
</script>

<style scoped>
.ck-table-panel {
  min-width: 240px;
  padding: 12px;
}

.ck-table-section {
  margin-bottom: 16px;
}

.ck-table-section:last-child {
  margin-bottom: 0;
}

.ck-table-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  padding: 0 0 4px 0;
  border-bottom: 1px solid #eee;
}

.ck-table-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ck-table-btn {
  justify-content: flex-start !important;
  text-align: left !important;
  padding: 8px 10px !important;
  font-size: 12px !important;
  border-radius: 4px !important;
  width: 100% !important;
  min-width: auto !important;
  border: 1px solid transparent !important;
  transition: all 0.2s ease !important;
}

.ck-table-btn i {
  margin-right: 8px !important;
  width: 12px !important;
  margin-left: 0 !important;
}

.ck-table-btn:hover {
  background: hsl(208, 88%, 95%) !important;
  border-color: hsl(208, 88%, 85%) !important;
}

.ck-table-btn-danger:hover {
  background: hsl(0, 88%, 95%) !important;
  border-color: hsl(0, 88%, 85%) !important;
  color: hsl(0, 88%, 45%) !important;
}

.ck-color-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}

.ck-color-grid__tile {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid hsl(0, 0%, 92%);
  cursor: pointer;
}

.ck-table-grid-panel {
  min-width: 280px;
  padding: 12px;
}

.ck-table-grid-header {
  text-align: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.ck-table-grid-info {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  background: hsl(208, 88%, 95%);
  padding: 4px 12px;
  border-radius: 4px;
  display: inline-block;
}

.ck-table-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
  padding: 8px;
  background: hsl(0, 0%, 98%);
  border-radius: 6px;
  border: 1px solid hsl(0, 0%, 92%);
}

.ck-table-grid-row {
  display: flex;
  gap: 2px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  transform: scaleY(1);
}

.ck-table-grid-row--shrinking {
  opacity: 0.6;
  transform: scaleY(0.8);
  transition: all 0.3s ease-out;
}

.ck-table-grid-cell {
  width: 20px;
  height: 16px;
  border: 1px solid hsl(0, 0%, 85%);
  background: white;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
  opacity: 1;
  transform: scale(1);
}

.ck-table-grid-cell:hover {
  border-color: hsl(208, 88%, 52%);
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ck-table-grid-cell--hovered {
  background: hsl(208, 88%, 92%) !important;
  border-color: hsl(208, 88%, 52%) !important;
  transform: scale(1.02);
  box-shadow: inset 0 0 0 1px hsl(208, 88%, 52%);
}

.ck-table-grid-cell--fading {
  opacity: 0.4;
  transform: scale(0.95);
  transition: all 0.3s ease-out;
}

.ck-table-grid-footer {
  border-top: 1px solid hsl(0, 0%, 92%);
  padding-top: 8px;
}

.ck-table-grid-custom {
  width: 100%;
  justify-content: flex-start !important;
  padding: 8px 12px !important;
  font-size: 12px !important;
  color: hsl(208, 88%, 52%) !important;
}

.ck-table-grid-custom:hover {
  background: hsl(208, 88%, 95%) !important;
}

.ck-table-grid-custom i {
  margin-right: 6px !important;
}
</style>
