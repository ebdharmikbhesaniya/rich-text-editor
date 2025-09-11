import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useTableStore = defineStore("table", () => {
  // State
  const isInTableCell = ref(false);
  const currentHeaderColor = ref("#f0f0f0");
  const maxGridRows = ref(5);
  const maxGridCols = ref(5);
  const hoveredRows = ref(1);
  const hoveredCols = ref(1);

  const headerColorPalette = ref([
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
  ]);

  const gridConfig = ref({
    minSize: { rows: 5, cols: 5 },
    maxSize: { rows: 12, cols: 15 },
    expandThreshold: 2,
    shrinkThreshold: 2,
    expandStep: 2,
    shrinkStep: 2,
  });

  // Computed
  const tableSize = computed(() => `${hoveredRows.value}×${hoveredCols.value}`);

  // Actions
  const checkTableCellState = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      isInTableCell.value = false;
      return;
    }

    let node = sel.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    let inTable = false;
    while (node) {
      if (
        (node as Element).tagName === "TH" ||
        (node as Element).tagName === "TD"
      ) {
        inTable = true;
        break;
      }
      node = (node as Element).parentElement;
    }

    isInTableCell.value = inTable;
  };

  const updateGridHover = (row: number, col: number) => {
    hoveredRows.value = row;
    hoveredCols.value = col;
    resizeGridDynamically(row, col);
  };

  const resetGridHover = () => {
    hoveredRows.value = 1;
    hoveredCols.value = 1;
    gradualResetToMinSize();
  };

  const resizeGridDynamically = (hoveredRow: number, hoveredCol: number) => {
    const config = gridConfig.value;

    // Handle ROWS
    const currentRows = maxGridRows.value;
    if (
      hoveredRow >= currentRows - config.expandThreshold &&
      currentRows < config.maxSize.rows
    ) {
      const newRowCount = Math.min(
        currentRows + config.expandStep,
        config.maxSize.rows
      );
      if (newRowCount > currentRows) {
        maxGridRows.value = newRowCount;
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
        maxGridRows.value = newRowCount;
      }
    }

    // Handle COLUMNS
    const currentCols = maxGridCols.value;
    if (
      hoveredCol >= currentCols - config.expandThreshold &&
      currentCols < config.maxSize.cols
    ) {
      const newColCount = Math.min(
        currentCols + config.expandStep,
        config.maxSize.cols
      );
      if (newColCount > currentCols) {
        maxGridCols.value = newColCount;
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
        maxGridCols.value = newColCount;
      }
    }
  };

  const gradualResetToMinSize = () => {
    const resetInterval = setInterval(() => {
      let hasChanges = false;

      if (maxGridRows.value > gridConfig.value.minSize.rows) {
        maxGridRows.value = Math.max(
          maxGridRows.value - 1,
          gridConfig.value.minSize.rows
        );
        hasChanges = true;
      }

      if (maxGridCols.value > gridConfig.value.minSize.cols) {
        maxGridCols.value = Math.max(
          maxGridCols.value - 1,
          gridConfig.value.minSize.cols
        );
        hasChanges = true;
      }

      if (!hasChanges) {
        clearInterval(resetInterval);
      }
    }, 100);
  };

  return {
    // State
    isInTableCell,
    currentHeaderColor,
    maxGridRows,
    maxGridCols,
    hoveredRows,
    hoveredCols,
    headerColorPalette,
    gridConfig,

    // Computed
    tableSize,

    // Actions
    checkTableCellState,
    updateGridHover,
    resetGridHover,
    resizeGridDynamically,
    gradualResetToMinSize,
  };
});
