export function saveSelection(editable: HTMLElement): Range | null {
  const selection = window.getSelection();

  if (!selection || !selection.rangeCount || !editable) return null;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;

  // Check if the selection is within the editor
  const isCursorInEditor =
    editable.contains(container) || editable === container;

  if (isCursorInEditor) {
    return range.cloneRange();
  } else {
    // Place cursor intelligently at end of content
    if (editable) {
      editable.focus();
      const range = document.createRange();
      let targetNode = null;

      // Look for the last paragraph or block element
      const blockElements = editable.querySelectorAll(
        "p, div, h1, h2, h3, h4, h5, h6, li"
      );
      if (blockElements.length > 0) {
        targetNode = blockElements[blockElements.length - 1];
      }

      if (targetNode) {
        if (targetNode.childNodes.length > 0) {
          const lastChild = targetNode.lastChild;
          if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
            range.setStart(lastChild, lastChild.textContent?.length || 0);
            range.setEnd(lastChild, lastChild.textContent?.length || 0);
          } else {
            range.setStartAfter(lastChild || targetNode);
            range.setEndAfter(lastChild || targetNode);
          }
        } else {
          range.setStart(targetNode, 0);
          range.setEnd(targetNode, 0);
        }
      } else {
        // Fallback: place at end of editor content
        if (editable.childNodes.length > 0) {
          const lastChild = editable.lastChild;
          if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
            range.setStart(lastChild, lastChild.textContent?.length || 0);
            range.setEnd(lastChild, lastChild.textContent?.length || 0);
          } else {
            range.setStartAfter(lastChild || editable);
            range.setEndAfter(lastChild || editable);
          }
        } else {
          range.setStart(editable, 0);
          range.setEnd(editable, 0);
        }
      }

      selection.removeAllRanges();
      selection.addRange(range);
      return range.cloneRange();
    }
  }

  return null;
}

export function restoreSelection(range: Range | null, editable?: HTMLElement) {
  if (!range) return;

  if (editable) {
    editable.focus();
  }

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function getSelectedText(): string {
  const selection = window.getSelection();
  return selection ? selection.toString() : "";
}
