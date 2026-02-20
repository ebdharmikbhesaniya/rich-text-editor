<template>
  <div class="flex items-center gap-1">
    <Button v-if="editorStore.isToolEnabled('bulletList')" variant="ghost" size="sm"
      :class="{ 'bg-blue-100': isInList('ul') }" @mousedown="(e: any) => handleListClick(e, 'bullet')"
      title="Bulleted List">
      <List class="h-4 w-4" />
    </Button>

    <Button v-if="editorStore.isToolEnabled('numberedList')" variant="ghost" size="sm"
      :class="{ 'bg-blue-100': isInList('ol') }" @mousedown="(e: any) => handleListClick(e, 'numbered')"
      title="Numbered List">
      <ListOrdered class="h-4 w-4" />
    </Button>

    <Button v-if="editorStore.isToolEnabled('taskList')" variant="ghost" size="sm"
      :class="{ 'bg-blue-100': isInTaskList() }" @mousedown="(e: any) => handleListClick(e, 'task')"
      title="Task List (Ctrl+Shift+T)">
      <ListTodo class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { List, ListOrdered, ListTodo } from "lucide-vue-next";
import { onMounted, onUnmounted } from 'vue';

const editorStore = useEditorStore();

// Enhanced selection and utility functions
const getSelection = () => {
  const sel = window.getSelection();
  return sel && sel.rangeCount > 0 ? sel : null;
};

const focusElement = (element: HTMLElement, position = 'start') => {
  const sel = getSelection();
  if (!sel || !element) return;

  const range = document.createRange();

  if (position === 'end') {
    range.selectNodeContents(element);
    range.collapse(false);
  } else {
    if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
      range.setStart(element.firstChild, 0);
    } else if (element.firstChild && (element.firstChild as Element).nodeName === 'BR') {
      range.setStartBefore(element.firstChild);
    } else {
      range.setStart(element, 0);
    }
    range.collapse(true);
  }

  sel.removeAllRanges();
  sel.addRange(range);
  element.focus();
};

const getCursorPositionInElement = (element: HTMLElement, range: Range): number => {
  let pos = 0;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);

  let node;
  while (node = walker.nextNode()) {
    if (node === range.startContainer) return pos + range.startOffset;
    pos += node.textContent?.length || 0;
  }
  return pos;
};

const insertAtCursor = (element: HTMLElement) => {
  const sel = getSelection();
  if (!sel) return false;

  const range = sel.getRangeAt(0);
  let container = range.startContainer;

  if (container.nodeType === Node.TEXT_NODE) {
    container = container.parentElement;
  }

  let replaceTarget: HTMLElement | null = null;
  let current = container as HTMLElement;

  while (current && current !== editorStore.editorElement) {
    if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'DIV'].includes(current.tagName)) {
      replaceTarget = current;
      break;
    }
    current = current.parentElement as HTMLElement;
  }

  if (replaceTarget) {
    const existingText = replaceTarget.textContent?.trim();
    if (existingText) {
      const editableElement = element.querySelector('[contenteditable="true"]') as HTMLElement;
      if (editableElement) editableElement.textContent = existingText;
    }
    replaceTarget.parentNode?.replaceChild(element, replaceTarget);
  } else {
    range.deleteContents();
    range.insertNode(element);
  }

  const nextP = document.createElement('p');
  nextP.innerHTML = '<br>';
  element.parentNode?.insertBefore(nextP, element.nextSibling);

  return true;
};

// Check functions for regular lists
const isInList = (listType: "ul" | "ol"): boolean => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  let node = selection.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editorStore.editorElement) {
    if ((node as Element).tagName?.toLowerCase() === listType &&
      !(node as Element).getAttribute('data-type')) {
      return true;
    }
    node = (node as Element).parentElement;
  }

  return false;
};

// Task list check functions
const isInTaskList = (): boolean => {
  return getCurrentTaskList() !== null;
};

const getCurrentTaskList = () => {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  let element = sel.getRangeAt(0).startContainer;
  if (element.nodeType === Node.TEXT_NODE) element = element.parentElement;

  while (element && element !== editorStore.editorElement) {
    if ((element as Element).getAttribute && (element as Element).getAttribute('data-type') === 'taskList') return element;
    element = (element as Element).parentElement;
  }
  return null;
};

const getCurrentTaskItem = () => {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  let element = sel.getRangeAt(0).startContainer;
  if (element.nodeType === Node.TEXT_NODE) element = element.parentElement;

  while (element && element !== editorStore.editorElement) {
    if ((element as Element).getAttribute && (element as Element).getAttribute('data-type') === 'taskItem') return element;
    element = (element as Element).parentElement;
  }
  return null;
};

// Task list creation and management
const createTaskItem = (text = '', checked = false): HTMLElement => {
  const li = document.createElement('li');
  li.setAttribute('data-type', 'taskItem');
  li.setAttribute('data-checked', checked.toString());

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.contentEditable = 'false';

  const textDiv = document.createElement('div');
  textDiv.contentEditable = 'true';
  textDiv.innerHTML = text.trim() ? text : '<br>';

  li.appendChild(checkbox);
  li.appendChild(textDiv);

  checkbox.addEventListener('change', () => {
    li.setAttribute('data-checked', checkbox.checked.toString());
    applyTaskListStyles(li.parentElement as HTMLElement);
  });

  return li;
};

const applyTaskListStyles = (ul: HTMLElement) => {
  if (!ul || ul.getAttribute('data-type') !== 'taskList') return;

  Object.assign(ul.style, {
    listStyle: 'none',
    paddingLeft: '0',
    margin: '1rem 0',
  });

  ul.querySelectorAll('[data-type="taskItem"]').forEach(item => {
    const isChecked = (item as Element).getAttribute('data-checked') === 'true';

    Object.assign((item as HTMLElement).style, {
      display: 'flex',
      alignItems: 'center',
      margin: '0.5rem 0',
      padding: '4px 0',
      listStyle: 'none',
      gap: '0.75rem',
    });

    const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox) {
      Object.assign(checkbox.style, {
        margin: '0',
        cursor: 'pointer',
        flexShrink: '0',
        width: '18px',
        height: '18px',
        border: `2px solid ${isChecked ? '#28a745' : '#6c757d'}`,
        borderRadius: '4px',
        background: isChecked ? '#28a745' : '#fff',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: isChecked ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e")` : 'none',
        backgroundSize: isChecked ? '14px 14px' : 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      });
    }

    const textDiv = item.querySelector('div[contenteditable="true"]') as HTMLElement;
    if (textDiv) {
      Object.assign(textDiv.style, {
        flex: '1',
        outline: 'none',
        padding: '4px 8px',
        margin: '0',
        lineHeight: '1.5',
        textDecoration: isChecked ? 'line-through' : 'none',
        opacity: isChecked ? '0.7' : '1',
        color: isChecked ? '#6c757d' : '#212529',
      });

      textDiv.addEventListener('focus', () => {
        textDiv.style.background = '#fff';
        textDiv.style.boxShadow = '0 0 0 2px rgba(0,123,255,.25)';
      });

      textDiv.addEventListener('blur', () => {
        textDiv.style.background = 'transparent';
        textDiv.style.boxShadow = 'none';
      });
    }
  });
};

// Task list navigation and behavior
const handleTaskListEnter = (): boolean => {
  const currentItem = getCurrentTaskItem();
  if (!currentItem) return false;

  const textDiv = currentItem.querySelector('div[contenteditable="true"]') as HTMLElement;
  const sel = getSelection();

  if (!sel || !textDiv) return false;

  const range = sel.getRangeAt(0);
  const content = textDiv.textContent || '';

  // If current item is empty, exit task list
  if (content.trim() === '' || content === '\u00A0' || textDiv.innerHTML === '<br>') {
    return exitTaskList();
  }

  // Create new task item when Enter is pressed
  const cursorPos = getCursorPositionInElement(textDiv, range);
  const beforeCursor = content.substring(0, cursorPos);
  const afterCursor = content.substring(cursorPos);

  // Update current item with text before cursor
  textDiv.textContent = beforeCursor;
  if (!beforeCursor.trim()) textDiv.innerHTML = '<br>';

  // Create new task item with text after cursor
  const ul = currentItem.parentElement as HTMLElement;
  const newItem = createTaskItem(afterCursor, false);
  ul.insertBefore(newItem, currentItem.nextSibling);

  // Focus the new task item
  const newTextDiv = newItem.querySelector('div[contenteditable="true"]') as HTMLElement;
  focusElement(newTextDiv, 'start');

  applyTaskListStyles(ul);
  editorStore.updateToolbarState();
  return true;
};

const exitTaskList = (): boolean => {
  const currentItem = getCurrentTaskItem();
  if (!currentItem) return false;

  const ul = currentItem.parentElement as HTMLElement;

  if (ul.children.length === 1) {
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    p.classList.add('plain-paragraph');

    ul.parentNode?.replaceChild(p, ul);
    focusElement(p, 'start');
    editorStore.updateToolbarState();
    return true;
  }

  currentItem.remove();

  const p = document.createElement('p');
  p.innerHTML = '<br>';
  p.classList.add('plain-paragraph');

  ul.parentNode?.insertBefore(p, ul.nextSibling);
  focusElement(p, 'start');

  editorStore.updateToolbarState();
  return true;
};

const createNewTaskListFromCurrent = () => {
  const currentTaskList = getCurrentTaskList();
  if (!currentTaskList) return;

  const ul = document.createElement('ul');
  ul.setAttribute('data-type', 'taskList');

  const li = createTaskItem('', false);
  ul.appendChild(li);

  currentTaskList.parentNode?.insertBefore(ul, currentTaskList.nextSibling);

  setTimeout(() => {
    const textDiv = li.querySelector('div[contenteditable="true"]') as HTMLElement;
    focusElement(textDiv, 'start');
    applyTaskListStyles(ul);
    editorStore.updateToolbarState();
  }, 10);
};

// Main list click handler (updated to handle all three list types)
const handleListClick = (
  event: MouseEvent,
  listType: "bullet" | "numbered" | "task"
) => {
  event.preventDefault();

  if (!editorStore.editorElement) return;

  editorStore.editorElement.focus();

  const selection = window.getSelection();
  if (!selection) return;

  let range: Range;
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.setStart(
      editorStore.editorElement,
      editorStore.editorElement.childNodes.length
    );
    range.collapse(true);
  }

  if (listType === "task") {
    const currentlyInTaskList = isInTaskList();
    if (currentlyInTaskList) {
      createNewTaskList(range, selection);
    } else {
      createTaskList(range, selection);
    }
  } else {
    const htmlListType = listType === "bullet" ? "ul" : "ol";
    const currentlyInList = isInList(htmlListType);

    if (currentlyInList) {
      removeFromList(range, selection);
    } else {
      createList(range, selection, htmlListType);
    }
  }

  setTimeout(() => {
    editorStore.updateToolbarState();
  }, 10);
};

// Task list creation functions
const createNewTaskList = (range: Range, selection: Selection) => {
  const currentTaskList = getCurrentTaskList();
  if (!currentTaskList) return createTaskList(range, selection);

  const ul = document.createElement('ul');
  ul.setAttribute('data-type', 'taskList');

  const li = createTaskItem('', false);
  ul.appendChild(li);

  currentTaskList.parentNode?.insertBefore(ul, currentTaskList.nextSibling);

  setTimeout(() => {
    const textDiv = li.querySelector('div[contenteditable="true"]') as HTMLElement;
    focusElement(textDiv, 'start');
    applyTaskListStyles(ul);
    editorStore.updateToolbarState();
  }, 10);
};

const createTaskList = (range: Range, selection: Selection) => {
  const selectedText = selection.toString().trim();

  const ul = document.createElement('ul');
  ul.setAttribute('data-type', 'taskList');

  const li = createTaskItem(selectedText, false);
  ul.appendChild(li);

  if (insertAtCursor(ul)) {
    setTimeout(() => {
      const textDiv = li.querySelector('div[contenteditable="true"]') as HTMLElement;
      focusElement(textDiv, selectedText ? 'end' : 'start');
      applyTaskListStyles(ul);
      editorStore.updateToolbarState();
    }, 10);
  }
};

// Regular list functions (unchanged from your original code)
const createList = (
  range: Range,
  selection: Selection,
  listType: "ul" | "ol"
) => {
  const selectedText = selection.toString().trim();

  const listElement = document.createElement(listType);
  const listItem = document.createElement("li");

  listElement.style.cssText = `
    margin: 1em 0;
    padding-left: 1.5em;
  `;

  listItem.style.cssText = `
    margin: 0.25em 0;
    list-style-type: ${listType === "ul" ? "disc" : "decimal"};
    list-style-position: outside;
  `;

  if (selectedText) {
    listItem.textContent = selectedText;
    range.deleteContents();
  } else {
    listItem.innerHTML = "&nbsp;";
  }

  listElement.appendChild(listItem);
  range.insertNode(listElement);

  const followingParagraph = document.createElement("p");
  followingParagraph.innerHTML = "<br>";
  listElement.parentNode?.insertBefore(
    followingParagraph,
    listElement.nextSibling
  );

  const newRange = document.createRange();
  if (selectedText) {
    newRange.setStart(listItem.firstChild!, listItem.textContent!.length);
  } else {
    newRange.setStart(listItem, 0);
  }
  newRange.collapse(true);

  selection.removeAllRanges();
  selection.addRange(newRange);
  (listItem as HTMLElement).focus();
};

const removeFromList = (range: Range, selection: Selection) => {
  let node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement!;
  }

  while (node && node !== editorStore.editorElement) {
    if ((node as Element).tagName === "LI") {
      const listItem = node as HTMLElement;
      const list = listItem.parentElement;
      const listContent = listItem.innerHTML;

      const paragraph = document.createElement("p");
      paragraph.innerHTML = listContent || "&nbsp;";
      paragraph.style.margin = "1em 0";

      list?.parentNode?.insertBefore(paragraph, list);
      listItem.remove();

      if (list && list.children.length === 0) {
        list.remove();
      }

      const newRange = document.createRange();
      if (paragraph.firstChild) {
        newRange.setStart(paragraph.firstChild, 0);
      } else {
        newRange.setStart(paragraph, 0);
      }
      newRange.collapse(true);

      selection.removeAllRanges();
      selection.addRange(newRange);
      break;
    }
    node = (node as Element).parentElement!;
  }
};

// Global keyboard handler for task lists
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!editorStore.editorElement) return;

  // Detect Mac vs PC
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? e.metaKey : e.ctrlKey;

  // Ctrl+Shift+T or Cmd+Shift+T to create new task list
  if (cmdKey && e.shiftKey && (e.key === 'T' || e.key === 't')) {
    e.preventDefault();
    e.stopPropagation();
    handleListClick(e as any, 'task');
    return;
  }

  // Enhanced Enter behavior for task lists
  if (e.key === 'Enter' && !e.shiftKey) {
    const currentItem = getCurrentTaskItem();
    if (currentItem) {
      e.preventDefault();
      e.stopPropagation();
      handleTaskListEnter();
      return;
    }
  }

  // Shift+Enter to create new task list
  if (e.key === 'Enter' && e.shiftKey && isInTaskList()) {
    e.preventDefault();
    e.stopPropagation();
    createNewTaskListFromCurrent();
    return;
  }
};

// Event listener setup
let globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

onMounted(() => {
  globalKeydownHandler = handleGlobalKeydown;
  
  document.addEventListener('keydown', globalKeydownHandler, true);
  
  if (editorStore.editorElement) {
    editorStore.editorElement.addEventListener('keydown', globalKeydownHandler, true);

    editorStore.editorElement.querySelectorAll('[data-type="taskList"]').forEach(ul => {
      applyTaskListStyles(ul as HTMLElement);
    });
  } else {
    const checkEditor = setInterval(() => {
      if (editorStore.editorElement) {
        editorStore.editorElement.addEventListener('keydown', globalKeydownHandler!, true);
        clearInterval(checkEditor);
      }
    }, 100);
    
    setTimeout(() => clearInterval(checkEditor), 10000);
  }
});

onUnmounted(() => {
  if (globalKeydownHandler) {
    document.removeEventListener('keydown', globalKeydownHandler, true);
    
    if (editorStore.editorElement) {
      editorStore.editorElement.removeEventListener('keydown', globalKeydownHandler, true);
    }
  }
});
</script>

<style scoped>
/* Plain paragraph styling - NO BACKGROUND */
.editor-content :deep(p.plain-paragraph) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 1em 0 !important;
  outline: none !important;
}

/* Task List - NO BACKGROUND */
.editor-content :deep(ul[data-type="taskList"]) {
  list-style: none !important;
  padding: 0 !important;
  margin: 1rem 0 !important;
}

/* Task Items - NO BACKGROUND */
.editor-content :deep(li[data-type="taskItem"]) {
  display: flex !important;
  align-items: center !important;
  margin: 0.25rem 0 !important;
  padding: 0 !important;
  list-style: none !important;
  gap: 0.5rem !important;
}

/* Checkbox styling */
.editor-content :deep(li[data-type="taskItem"] input[type="checkbox"]) {
  width: 16px !important;
  height: 16px !important;
  cursor: pointer !important;
}

/* Text styling */
.editor-content :deep(li[data-type="taskItem"] div[contenteditable="true"]) {
  flex: 1 !important;
  outline: none !important;
  padding: 0 !important;
}

.editor-content :deep(li[data-type="taskItem"][data-checked="true"] div[contenteditable="true"]) {
  text-decoration: line-through !important;
  opacity: 0.6 !important;
}
</style>
