export const saveSelection = (editorElement: HTMLElement): Range | null => {
  const selection = window.getSelection();

  const isCursorInEditor = () => {
    if (!selection?.rangeCount || !editorElement) return false;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    return editorElement.contains(container) || editorElement === container;
  };

  if (isCursorInEditor()) {
    return selection!.getRangeAt(0).cloneRange();
  } else if (editorElement) {
    editorElement.focus();
    const range = document.createRange();

    if (editorElement.childNodes.length > 0) {
      const lastChild = editorElement.lastChild!;
      if (lastChild.nodeType === Node.TEXT_NODE) {
        range.setStart(lastChild, lastChild.textContent?.length || 0);
        range.setEnd(lastChild, lastChild.textContent?.length || 0);
      } else {
        range.setStartAfter(lastChild);
        range.setEndAfter(lastChild);
      }
    } else {
      range.setStart(editorElement, 0);
      range.setEnd(editorElement, 0);
    }

    selection?.removeAllRanges();
    selection?.addRange(range);
    return range.cloneRange();
  }

  return null;
};

export const restoreSelection = (
  range: Range | null,
  editorElement: HTMLElement
) => {
  if (range && editorElement) {
    editorElement.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
};
