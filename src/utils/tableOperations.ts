export function insertTableRow(
  editable: HTMLElement,
  position: "above" | "below",
  currentTableHeaderColor: string
) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  // Find the current table row
  while (node && node !== editable) {
    if (node instanceof HTMLElement && node.tagName === "TR") {
      const currentRow = node;
      const cellCount = currentRow.children.length;

      // Create new row with same number of cells
      const newRow = document.createElement("tr");

      for (let i = 0; i < cellCount; i++) {
        const originalCell = currentRow.children[i];
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
              background-color: ${currentTableHeaderColor};
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

      // Insert row at correct position
      const tbody = currentRow.parentNode;
      if (!tbody) return;

      if (position === "above") {
        tbody.insertBefore(newRow, currentRow);
      } else {
        if (currentRow.nextSibling) {
          tbody.insertBefore(newRow, currentRow.nextSibling);
        } else {
          tbody.appendChild(newRow);
        }
      }
      break;
    }
    node = node.parentElement;
  }
}

export function deleteTableRow(editable: HTMLElement) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editable) {
    if (node instanceof HTMLElement && node.tagName === "TR") {
      const currentRow = node;
      const tbody = currentRow.parentNode;

      if (!tbody || tbody.children.length <= 1) {
        alert("Cannot delete the last row");
        return;
      }

      currentRow.remove();
      break;
    }
    node = node.parentElement;
  }
}

export function insertTableColumn(
  editable: HTMLElement,
  position: "left" | "right",
  currentTableHeaderColor: string
) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editable) {
    if (
      node instanceof HTMLElement &&
      (node.tagName === "TD" || node.tagName === "TH")
    ) {
      const table = node.closest("table");
      if (!table) return;

      const currentCell = node;
      const currentRow = currentCell.parentNode as HTMLElement;

      // Get column index
      const cells = Array.from(currentRow.children);
      const cellIndex = cells.indexOf(currentCell);
      const insertIndex = position === "left" ? cellIndex : cellIndex + 1;

      // Add column to all rows
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
              background-color: ${currentTableHeaderColor};
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

      // Update column widths
      const firstRow = table.querySelector("tr");
      if (firstRow) {
        const newColumnCount = firstRow.children.length;
        const newWidth = Math.floor(100 / newColumnCount);

        let colgroup = table.querySelector("colgroup");
        if (colgroup) {
          colgroup.innerHTML = "";
          for (let i = 0; i < newColumnCount; i++) {
            const col = document.createElement("col");
            col.style.width = `${newWidth}%`;
            colgroup.appendChild(col);
          }
        }
      }
      break;
    }
    node = node.parentElement;
  }
}

export function deleteTableColumn(editable: HTMLElement) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editable) {
    if (
      node instanceof HTMLElement &&
      (node.tagName === "TD" || node.tagName === "TH")
    ) {
      const table = node.closest("table");
      if (!table) return;

      const currentCell = node;
      const currentRow = currentCell.parentNode as HTMLElement;

      const firstRow = table.querySelector("tr");
      if (!firstRow || firstRow.children.length <= 1) {
        alert("Cannot delete the last column");
        return;
      }

      // Get column index
      const cells = Array.from(currentRow.children);
      const cellIndex = cells.indexOf(currentCell);

      // Remove column from all rows
      const allRows = Array.from(table.querySelectorAll("tr"));
      allRows.forEach((row) => {
        const cellsInRow = Array.from(row.children);
        if (cellsInRow[cellIndex]) {
          cellsInRow[cellIndex].remove();
        }
      });

      // Update column widths
      const remainingColumnCount = firstRow.children.length;
      const newWidth = Math.floor(100 / remainingColumnCount);

      let colgroup = table.querySelector("colgroup");
      if (colgroup) {
        colgroup.innerHTML = "";
        for (let i = 0; i < remainingColumnCount; i++) {
          const col = document.createElement("col");
          col.style.width = `${newWidth}%`;
          colgroup.appendChild(col);
        }
      }
      break;
    }
    node = node.parentElement;
  }
}

export function toggleTableHeader(
  editable: HTMLElement,
  currentTableHeaderColor: string
) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editable) {
    if (
      node instanceof HTMLElement &&
      (node.tagName === "TH" || node.tagName === "TD")
    ) {
      const isHeader = node.tagName === "TH";
      const newTagName = isHeader ? "TD" : "TH";

      // Create new element with opposite tag
      const newElement = document.createElement(newTagName);
      newElement.innerHTML = node.innerHTML;

      // Copy attributes
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        newElement.setAttribute(attr.name, attr.value);
      }

      // If converting to header, apply default header styling
      if (newTagName === "TH") {
        newElement.style.backgroundColor = currentTableHeaderColor;
        newElement.style.fontWeight = "bold";
        newElement.style.textAlign = "center";
      } else {
        newElement.style.fontWeight = "normal";
        newElement.style.textAlign = "left";
      }

      // Replace the element
      if (node.parentElement) {
        node.parentElement.replaceChild(newElement, node);

        // Update selection to new element
        const range = document.createRange();
        range.selectNodeContents(newElement);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      break;
    }
    node = node.parentElement;
  }
}

export function changeTableHeaderColor(editable: HTMLElement, color: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let node = sel.anchorNode;
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editable) {
    if (
      node instanceof HTMLElement &&
      (node.tagName === "TH" || node.tagName === "TD")
    ) {
      node.style.backgroundColor = color;
      break;
    }
    node = node.parentElement;
  }
}

export function createTable(
  rows: number,
  cols: number,
  currentTableHeaderColor: string
): string {
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
            background-color: ${currentTableHeaderColor};
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
  return html;
}
