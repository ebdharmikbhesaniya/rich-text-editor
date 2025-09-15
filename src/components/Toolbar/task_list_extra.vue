<template>
  <div class="task-list-toolbar-container">
    <!-- Task List Toolbar -->
    <div class="task-list-toolbar" v-if="showToolbar && (getCurrentTaskList() || taskLists.length > 0)">
      <div class="toolbar-section">
        <Button variant="ghost" size="sm" @click="addNewTask" title="Add Task (Alt+T)">
          <Plus class="h-4 w-4 mr-1" />
          Add Task
        </Button>
        
        <Button variant="ghost" size="sm" @click="toggleCurrentTask" title="Toggle Complete (Alt+C)">
          <Check class="h-4 w-4 mr-1" />
          Toggle
        </Button>
        
        <Button variant="ghost" size="sm" @click="clearCompleted" title="Clear Completed">
          <Trash2 class="h-4 w-4 mr-1" />
          Clear Done
        </Button>
      </div>
      
      <div class="toolbar-section">
        <select v-model="currentFilter" @change="applyFilter" class="filter-select">
          <option value="all">All Tasks</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        
        <select v-model="currentSort" @change="applySorting" class="sort-select">
          <option value="manual">Manual Order</option>
          <option value="completion">By Completion</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>
    </div>

    <!-- Original List Controls -->
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
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { List, ListOrdered, ListTodo, Plus, Check, Trash2, ChevronRight } from "lucide-vue-next";
import { onMounted, onUnmounted, ref, reactive, watch, nextTick } from 'vue';

const editorStore = useEditorStore();

// Enhanced state management
const showToolbar = ref(true);
const currentFilter = ref('all');
const currentSort = ref('manual');
const taskLists = ref<HTMLElement[]>([]);
const draggedItem = ref<HTMLElement | null>(null);
const taskData = reactive<{[key: string]: any}>({});

// Animation and interaction states
const animationDuration = 300;
const activeTaskId = ref<string | null>(null);

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

// Generate unique IDs for tasks
const generateTaskId = (): string => {
  return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

// Check functions
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

const isInTaskList = (): boolean => {
  return getCurrentTaskList() !== null;
};

const getCurrentTaskList = () => {
  const sel = getSelection();
  if (!sel) return null;

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
  if (!sel) return null;

  let element = sel.getRangeAt(0).startContainer;
  if (element.nodeType === Node.TEXT_NODE) element = element.parentElement;

  while (element && element !== editorStore.editorElement) {
    if ((element as Element).getAttribute && (element as Element).getAttribute('data-type') === 'taskItem') return element;
    element = (element as Element).parentElement;
  }
  return null;
};

// Enhanced task creation with nested support
const createTaskItem = (text = '', checked = false, level = 0, parentId?: string): HTMLElement => {
  const li = document.createElement('li');
  const taskId = generateTaskId();
  
  li.setAttribute('data-type', 'taskItem');
  li.setAttribute('data-checked', checked.toString());
  li.setAttribute('data-task-id', taskId);
  li.setAttribute('data-level', level.toString());
  if (parentId) li.setAttribute('data-parent-id', parentId);
  
  // Make draggable
  li.draggable = true;
  li.setAttribute('draggable', 'true');

  // Create indent container for nested tasks
  const indentContainer = document.createElement('div');
  indentContainer.className = 'task-indent-container';
  indentContainer.style.paddingLeft = `${level * 20}px`;

  const taskContainer = document.createElement('div');
  taskContainer.className = 'task-content-container';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.contentEditable = 'false';
  checkbox.className = 'task-checkbox';

  const textDiv = document.createElement('div');
  textDiv.contentEditable = 'true';
  textDiv.className = 'task-text';
  textDiv.innerHTML = text.trim() ? text : '<br>';

  // Collapse/expand button for nested tasks
  const expandBtn = document.createElement('button');
  expandBtn.className = 'task-expand-btn';
  expandBtn.innerHTML = '›';
  expandBtn.contentEditable = 'false';
  expandBtn.style.display = 'none';

  taskContainer.appendChild(expandBtn);
  taskContainer.appendChild(checkbox);
  taskContainer.appendChild(textDiv);
  indentContainer.appendChild(taskContainer);
  li.appendChild(indentContainer);

  // Store task data
  taskData[taskId] = {
    id: taskId,
    text: text,
    checked: checked,
    level: level,
    parentId: parentId,
    collapsed: false,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };

  // Event listeners
  checkbox.addEventListener('change', () => {
    li.setAttribute('data-checked', checkbox.checked.toString());
    taskData[taskId].checked = checkbox.checked;
    taskData[taskId].updated = new Date().toISOString();
    applyTaskListStyles(li.closest('[data-type="taskList"]') as HTMLElement);
    syncTaskData();
    applyFilter();
  });

  // Enhanced text editing with auto-save
  let saveTimeout: NodeJS.Timeout;
  textDiv.addEventListener('input', () => {
    taskData[taskId].text = textDiv.textContent || '';
    taskData[taskId].updated = new Date().toISOString();
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      syncTaskData();
    }, 1000);
  });

  // Focus highlighting
  textDiv.addEventListener('focus', () => {
    activeTaskId.value = taskId;
    li.classList.add('task-active');
  });

  textDiv.addEventListener('blur', () => {
    activeTaskId.value = null;
    li.classList.remove('task-active');
  });

  // Drag and drop events
  li.addEventListener('dragstart', handleDragStart);
  li.addEventListener('dragover', handleDragOver);
  li.addEventListener('drop', handleDrop);
  li.addEventListener('dragend', handleDragEnd);

  // Expand/collapse functionality
  expandBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTaskCollapse(taskId);
  });

  return li;
};

// Drag and drop handlers
const handleDragStart = (e: DragEvent) => {
  if (!e.target) return;
  draggedItem.value = e.target as HTMLElement;
  e.dataTransfer?.setData('text/plain', (e.target as HTMLElement).getAttribute('data-task-id') || '');
  (e.target as HTMLElement).style.opacity = '0.5';
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  if (!draggedItem.value || !e.target) return;

  const target = (e.target as HTMLElement).closest('[data-type="taskItem"]') as HTMLElement;
  if (!target || target === draggedItem.value) return;

  const taskList = target.closest('[data-type="taskList"]') as HTMLElement;
  if (!taskList) return;

  // Determine drop position
  const rect = target.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;
  const insertAfter = e.clientY > midpoint;

  if (insertAfter) {
    target.parentNode?.insertBefore(draggedItem.value, target.nextSibling);
  } else {
    target.parentNode?.insertBefore(draggedItem.value, target);
  }

  applyTaskListStyles(taskList);
  syncTaskData();
};

const handleDragEnd = (e: DragEvent) => {
  if (draggedItem.value) {
    draggedItem.value.style.opacity = '1';
    draggedItem.value = null;
  }
};

// Nested task functions
const createSubtask = (parentTaskId: string) => {
  const parentItem = document.querySelector(`[data-task-id="${parentTaskId}"]`) as HTMLElement;
  if (!parentItem) return;

  const parentLevel = parseInt(parentItem.getAttribute('data-level') || '0');
  const newSubtask = createTaskItem('', false, parentLevel + 1, parentTaskId);
  
  parentItem.parentNode?.insertBefore(newSubtask, parentItem.nextSibling);
  
  // Show expand button on parent
  const expandBtn = parentItem.querySelector('.task-expand-btn') as HTMLElement;
  if (expandBtn) expandBtn.style.display = 'inline-block';
  
  const textDiv = newSubtask.querySelector('.task-text') as HTMLElement;
  focusElement(textDiv, 'start');
  
  applyTaskListStyles(parentItem.closest('[data-type="taskList"]') as HTMLElement);
  syncTaskData();
};

const toggleTaskCollapse = (taskId: string) => {
  const taskItem = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
  if (!taskItem) return;

  const isCollapsed = taskData[taskId].collapsed;
  taskData[taskId].collapsed = !isCollapsed;

  const expandBtn = taskItem.querySelector('.task-expand-btn') as HTMLElement;
  if (expandBtn) {
    expandBtn.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)';
  }

  // Toggle visibility of child tasks
  const children = getChildTasks(taskId);
  children.forEach(child => {
    const childElement = document.querySelector(`[data-task-id="${child.id}"]`) as HTMLElement;
    if (childElement) {
      childElement.style.display = isCollapsed ? 'block' : 'none';
    }
  });

  syncTaskData();
};

const getChildTasks = (parentId: string) => {
  return Object.values(taskData).filter((task: any) => task.parentId === parentId);
};

// Enhanced styling with animations
const applyTaskListStyles = (ul: HTMLElement) => {
  if (!ul || ul.getAttribute('data-type') !== 'taskList') return;

  Object.assign(ul.style, {
    listStyle: 'none',
    paddingLeft: '0',
    margin: '1rem 0',
    position: 'relative',
  });

  ul.querySelectorAll('[data-type="taskItem"]').forEach((item, index) => {
    const isChecked = (item as Element).getAttribute('data-checked') === 'true';
    const level = parseInt((item as Element).getAttribute('data-level') || '0');

    Object.assign((item as HTMLElement).style, {
      display: 'flex',
      alignItems: 'flex-start',
      margin: '0.25rem 0',
      padding: '8px 0',
      listStyle: 'none',
      transition: `all ${animationDuration}ms ease`,
      opacity: isChecked ? '0.7' : '1',
      borderRadius: '6px',
      position: 'relative',
    });

    // Style task container
    const container = item.querySelector('.task-content-container') as HTMLElement;
    if (container) {
      Object.assign(container.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
      });
    }

    // Style expand button
    const expandBtn = item.querySelector('.task-expand-btn') as HTMLElement;
    if (expandBtn) {
      Object.assign(expandBtn.style, {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#6c757d',
        padding: '2px',
        minWidth: '16px',
        height: '16px',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease',
      });
    }

    // Style checkbox
    const checkbox = item.querySelector('.task-checkbox') as HTMLInputElement;
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
        backgroundRepeat: 'no-repeat',
        transition: 'all 0.2s ease',
      });
    }

    // Style text div
    const textDiv = item.querySelector('.task-text') as HTMLElement;
    if (textDiv) {
      Object.assign(textDiv.style, {
        flex: '1',
        outline: 'none',
        padding: '6px 8px',
        margin: '0',
        lineHeight: '1.5',
        textDecoration: isChecked ? 'line-through' : 'none',
        color: isChecked ? '#6c757d' : '#212529',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        minHeight: '24px',
      });

      textDiv.addEventListener('focus', () => {
        textDiv.style.background = '#f8f9fa';
        textDiv.style.boxShadow = '0 0 0 2px rgba(0,123,255,.25)';
      });

      textDiv.addEventListener('blur', () => {
        textDiv.style.background = 'transparent';
        textDiv.style.boxShadow = 'none';
      });
    }
  });

  updateTaskListCounter(ul);
};

// Task list counter
const updateTaskListCounter = (ul: HTMLElement) => {
  const tasks = ul.querySelectorAll('[data-type="taskItem"]');
  const completed = ul.querySelectorAll('[data-type="taskItem"][data-checked="true"]');
  
  let counter = ul.querySelector('.task-counter') as HTMLElement;
  if (!counter) {
    counter = document.createElement('div');
    counter.className = 'task-counter';
    ul.parentNode?.insertBefore(counter, ul);
  }
  
  counter.textContent = `${completed.length}/${tasks.length} completed`;
  Object.assign(counter.style, {
    fontSize: '12px',
    color: '#6c757d',
    marginBottom: '8px',
    fontWeight: '500',
  });
};

// Enhanced keyboard handlers
const handleTaskListEnter = (): boolean => {
  const currentItem = getCurrentTaskItem();
  if (!currentItem) return false;

  const textDiv = currentItem.querySelector('.task-text') as HTMLElement;
  const sel = getSelection();

  if (!sel || !textDiv) return false;

  const range = sel.getRangeAt(0);
  const content = textDiv.textContent || '';

  if (content.trim() === '' || content === '\u00A0' || textDiv.innerHTML === '<br>') {
    return exitTaskList();
  }

  const cursorPos = getCursorPositionInElement(textDiv, range);
  const beforeCursor = content.substring(0, cursorPos);
  const afterCursor = content.substring(cursorPos);

  textDiv.textContent = beforeCursor;
  if (!beforeCursor.trim()) textDiv.innerHTML = '<br>';

  const ul = currentItem.closest('[data-type="taskList"]') as HTMLElement;
  const level = parseInt(currentItem.getAttribute('data-level') || '0');
  const newItem = createTaskItem(afterCursor, false, level);
  
  currentItem.parentNode?.insertBefore(newItem, currentItem.nextSibling);

  const newTextDiv = newItem.querySelector('.task-text') as HTMLElement;
  focusElement(newTextDiv, 'start');

  applyTaskListStyles(ul);
  editorStore.updateToolbarState();
  return true;
};

const handleTaskListBackspace = (): boolean => {
  const currentItem = getCurrentTaskItem();
  if (!currentItem) return false;

  const textDiv = currentItem.querySelector('.task-text') as HTMLElement;
  const content = textDiv.textContent || '';

  if (content.trim() === '' || content === '\u00A0' || textDiv.innerHTML === '<br>') {
    const taskId = currentItem.getAttribute('data-task-id');
    if (taskId) delete taskData[taskId];
    
    const ul = currentItem.closest('[data-type="taskList"]') as HTMLElement;
    const prevItem = currentItem.previousElementSibling as HTMLElement;
    
    // Animate removal
    currentItem.style.transform = 'translateX(-100%)';
    currentItem.style.opacity = '0';
    
    setTimeout(() => {
      currentItem.remove();
      
      if (prevItem && prevItem.getAttribute('data-type') === 'taskItem') {
        const prevTextDiv = prevItem.querySelector('.task-text') as HTMLElement;
        focusElement(prevTextDiv, 'end');
      }
      
      applyTaskListStyles(ul);
      syncTaskData();
    }, animationDuration);
    
    return true;
  }
  
  return false;
};

const handleTaskListTab = (e: KeyboardEvent): boolean => {
  const currentItem = getCurrentTaskItem();
  if (!currentItem) return false;

  e.preventDefault();
  
  const taskId = currentItem.getAttribute('data-task-id');
  if (!taskId) return false;

  if (e.shiftKey) {
    // Unindent (move to parent level)
    const level = parseInt(currentItem.getAttribute('data-level') || '0');
    if (level > 0) {
      currentItem.setAttribute('data-level', (level - 1).toString());
      const container = currentItem.querySelector('.task-indent-container') as HTMLElement;
      if (container) container.style.paddingLeft = `${(level - 1) * 20}px`;
      
      taskData[taskId].level = level - 1;
      syncTaskData();
    }
  } else {
    // Indent (create subtask)
    const prevItem = currentItem.previousElementSibling as HTMLElement;
    if (prevItem && prevItem.getAttribute('data-type') === 'taskItem') {
      const prevLevel = parseInt(prevItem.getAttribute('data-level') || '0');
      const newLevel = prevLevel + 1;
      
      currentItem.setAttribute('data-level', newLevel.toString());
      const container = currentItem.querySelector('.task-indent-container') as HTMLElement;
      if (container) container.style.paddingLeft = `${newLevel * 20}px`;
      
      const prevTaskId = prevItem.getAttribute('data-task-id');
      if (prevTaskId) {
        currentItem.setAttribute('data-parent-id', prevTaskId);
        taskData[taskId].parentId = prevTaskId;
        taskData[taskId].level = newLevel;
        
        // Show expand button on parent
        const expandBtn = prevItem.querySelector('.task-expand-btn') as HTMLElement;
        if (expandBtn) expandBtn.style.display = 'inline-block';
      }
      
      syncTaskData();
    }
  }
  
  const ul = currentItem.closest('[data-type="taskList"]') as HTMLElement;
  applyTaskListStyles(ul);
  return true;
};

const exitTaskList = (): boolean => {
  const currentItem = getCurrentTaskItem();
  if (!currentItem) return false;

  const ul = currentItem.closest('[data-type="taskList"]') as HTMLElement;

  if (ul.children.length === 1) {
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    p.classList.add('plain-paragraph');

    ul.parentNode?.replaceChild(p, ul);
    focusElement(p, 'start');
    editorStore.updateToolbarState();
    return true;
  }

  const taskId = currentItem.getAttribute('data-task-id');
  if (taskId) delete taskData[taskId];
  
  currentItem.remove();

  const p = document.createElement('p');
  p.innerHTML = '<br>';
  p.classList.add('plain-paragraph');

  ul.parentNode?.insertBefore(p, ul.nextSibling);
  focusElement(p, 'start');

  syncTaskData();
  editorStore.updateToolbarState();
  return true;
};

// Toolbar functions
const addNewTask = () => {
  const currentList = getCurrentTaskList();
  if (currentList) {
    const newTask = createTaskItem('', false, 0);
    currentList.appendChild(newTask);
    const textDiv = newTask.querySelector('.task-text') as HTMLElement;
    focusElement(textDiv, 'start');
    applyTaskListStyles(currentList);
    syncTaskData();
  } else {
    // Create new task list
    handleListClick(new MouseEvent('click') as any, 'task');
  }
};

const toggleCurrentTask = () => {
  const currentItem = getCurrentTaskItem();
  if (currentItem) {
    const checkbox = currentItem.querySelector('.task-checkbox') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    }
  }
};

const clearCompleted = () => {
  const currentList = getCurrentTaskList();
  if (currentList) {
    const completedTasks = currentList.querySelectorAll('[data-type="taskItem"][data-checked="true"]');
    completedTasks.forEach(task => {
      const taskId = (task as Element).getAttribute('data-task-id');
      if (taskId) delete taskData[taskId];
      
      // Animate removal
      (task as HTMLElement).style.transform = 'translateX(100%)';
      (task as HTMLElement).style.opacity = '0';
      
      setTimeout(() => {
        task.remove();
        applyTaskListStyles(currentList);
        syncTaskData();
      }, animationDuration);
    });
  }
};

// Filtering and sorting
const applyFilter = () => {
  const allLists = document.querySelectorAll('[data-type="taskList"]');
  
  allLists.forEach(list => {
    const tasks = list.querySelectorAll('[data-type="taskItem"]');
    
    tasks.forEach(task => {
      const isCompleted = (task as Element).getAttribute('data-checked') === 'true';
      let show = true;
      
      switch (currentFilter.value) {
        case 'completed':
          show = isCompleted;
          break;
        case 'pending':
          show = !isCompleted;
          break;
        default:
          show = true;
      }
      
      (task as HTMLElement).style.display = show ? 'flex' : 'none';
    });
  });
};

const applySorting = () => {
  const currentList = getCurrentTaskList();
  if (!currentList) return;

  const tasks = Array.from(currentList.querySelectorAll('[data-type="taskItem"]')) as HTMLElement[];
  
  switch (currentSort.value) {
    case 'completion':
      tasks.sort((a, b) => {
        const aChecked = a.getAttribute('data-checked') === 'true';
        const bChecked = b.getAttribute('data-checked') === 'true';
        return aChecked === bChecked ? 0 : aChecked ? 1 : -1;
      });
      break;
    case 'alphabetical':
      tasks.sort((a, b) => {
        const aText = (a.querySelector('.task-text')?.textContent || '').toLowerCase();
        const bText = (b.querySelector('.task-text')?.textContent || '').toLowerCase();
        return aText.localeCompare(bText);
      });
      break;
  }
  
  if (currentSort.value !== 'manual') {
    tasks.forEach(task => currentList.appendChild(task));
    applyTaskListStyles(currentList);
  }
};

// Data synchronization
const syncTaskData = () => {
  // Save to localStorage
  localStorage.setItem('taskListData', JSON.stringify(taskData));
  
  // Emit event for external sync
  window.dispatchEvent(new CustomEvent('taskListUpdated', { 
    detail: { taskData: taskData } 
  }));
};

const loadTaskData = () => {
  try {
    const saved = localStorage.getItem('taskListData');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(taskData, parsed);
    }
  } catch (error) {
    console.warn('Failed to load task data:', error);
  }
};

// Export task data
const exportTaskData = () => {
  const data = {
    tasks: taskData,
    exported: new Date().toISOString(),
    version: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Import task data
const importTaskData = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (data.tasks) {
        Object.assign(taskData, data.tasks);
        syncTaskData();
        // Refresh all task lists
        document.querySelectorAll('[data-type="taskList"]').forEach(list => {
          applyTaskListStyles(list as HTMLElement);
        });
      }
    } catch (error) {
      console.error('Failed to import task data:', error);
    }
  };
  reader.readAsText(file);
};

// Main list click handler (enhanced)
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

const createNewTaskList = (range: Range, selection: Selection) => {
  const currentTaskList = getCurrentTaskList();
  if (!currentTaskList) return createTaskList(range, selection);

  const ul = document.createElement('ul');
  ul.setAttribute('data-type', 'taskList');
  ul.setAttribute('data-list-id', generateTaskId());

  const li = createTaskItem('', false);
  ul.appendChild(li);

  currentTaskList.parentNode?.insertBefore(ul, currentTaskList.nextSibling);

  setTimeout(() => {
    const textDiv = li.querySelector('.task-text') as HTMLElement;
    focusElement(textDiv, 'start');
    applyTaskListStyles(ul);
    taskLists.value.push(ul);
    editorStore.updateToolbarState();
  }, 10);
};

const createTaskList = (range: Range, selection: Selection) => {
  const selectedText = selection.toString().trim();

  const ul = document.createElement('ul');
  ul.setAttribute('data-type', 'taskList');
  ul.setAttribute('data-list-id', generateTaskId());

  const li = createTaskItem(selectedText, false);
  ul.appendChild(li);

  if (insertAtCursor(ul)) {
    // Add entrance animation
    ul.style.opacity = '0';
    ul.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      ul.style.transition = `all ${animationDuration}ms ease`;
      ul.style.opacity = '1';
      ul.style.transform = 'translateY(0)';
      
      const textDiv = li.querySelector('.task-text') as HTMLElement;
      focusElement(textDiv, selectedText ? 'end' : 'start');
      applyTaskListStyles(ul);
      taskLists.value.push(ul);
      editorStore.updateToolbarState();
    }, 10);
  }
};

// Regular list functions (unchanged)
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

// Global keyboard handler (enhanced)
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!editorStore.editorElement) return;

  // Shortcuts
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
    e.preventDefault();
    handleListClick(e as any, 'task');
    return;
  }

  if ((e.altKey) && e.key === 't') {
    e.preventDefault();
    addNewTask();
    return;
  }

  if ((e.altKey) && e.key === 'c') {
    e.preventDefault();
    toggleCurrentTask();
    return;
  }

  // Task list specific shortcuts
  if (isInTaskList()) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleTaskListEnter();
      return;
    }

    if (e.key === 'Backspace') {
      const currentItem = getCurrentTaskItem();
      const textDiv = currentItem?.querySelector('.task-text') as HTMLElement;
      if (textDiv && (textDiv.textContent?.trim() === '' || textDiv.innerHTML === '<br>')) {
        e.preventDefault();
        e.stopPropagation();
        handleTaskListBackspace();
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      handleTaskListTab(e);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const currentItem = getCurrentTaskItem();
      if (currentItem) {
        const taskId = currentItem.getAttribute('data-task-id');
        if (taskId) createSubtask(taskId);
      }
      return;
    }
  }
};

// Watchers for reactive updates
watch(currentFilter, applyFilter);
watch(currentSort, applySorting);

// Setup and cleanup
onMounted(() => {
  loadTaskData();
  
  if (editorStore.editorElement) {
    editorStore.editorElement.addEventListener('keydown', handleGlobalKeydown);

    // Initialize existing task lists
    editorStore.editorElement.querySelectorAll('[data-type="taskList"]').forEach(ul => {
      applyTaskListStyles(ul as HTMLElement);
      taskLists.value.push(ul as HTMLElement);
    });
  }

  // Listen for external data updates
  window.addEventListener('taskListDataUpdate', (e: any) => {
    if (e.detail?.taskData) {
      Object.assign(taskData, e.detail.taskData);
    }
  });
});

onUnmounted(() => {
  if (editorStore.editorElement) {
    editorStore.editorElement.removeEventListener('keydown', handleGlobalKeydown);
  }
});

// Expose functions for external use
defineExpose({
  addNewTask,
  toggleCurrentTask,
  clearCompleted,
  exportTaskData,
  importTaskData,
  syncTaskData,
  taskData,
  currentFilter,
  currentSort
});
</script>

<style scoped>
/* Task List Toolbar */
.task-list-toolbar-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select, .sort-select {
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  min-width: 100px;
}

.filter-select:focus, .sort-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,.25);
}

/* Task List Enhanced Styling */
.editor-content :deep(ul[data-type="taskList"]) {
  list-style: none !important;
  padding: 0 !important;
  margin: 1rem 0 !important;
  border-left: 3px solid #e9ecef;
  padding-left: 12px !important;
  position: relative;
}

.editor-content :deep(li[data-type="taskItem"]) {
  display: flex !important;
  align-items: flex-start !important;
  margin: 0.25rem 0 !important;
  padding: 8px 0 !important;
  list-style: none !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
  position: relative !important;
}

.editor-content :deep(li[data-type="taskItem"]:hover) {
  background-color: rgba(0,123,255,0.05) !important;
}

.editor-content :deep(li[data-type="taskItem"].task-active) {
  background-color: rgba(0,123,255,0.1) !important;
  border-left: 3px solid #007bff !important;
  padding-left: 8px !important;
}

.editor-content :deep(.task-indent-container) {
  width: 100%;
  transition: padding-left 0.2s ease;
}

.editor-content :deep(.task-content-container) {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.editor-content :deep(.task-expand-btn) {
  background: none !important;
  border: none !important;
  cursor: pointer !important;
  font-size: 14px !important;
  color: #6c757d !important;
  padding: 2px !important;
  min-width: 16px !important;
  height: 16px !important;
  display: none !important;
  align-items: center !important;
  justify-content: center !important;
  transition: transform 0.2s ease !important;
  border-radius: 2px !important;
}

.editor-content :deep(.task-expand-btn:hover) {
  background-color: rgba(0,0,0,0.1) !important;
}

.editor-content :deep(.task-checkbox) {
  width: 18px !important;
  height: 18px !important;
  cursor: pointer !important;
  flex-shrink: 0 !important;
  border: 2px solid #6c757d !important;
  border-radius: 4px !important;
  background: #fff !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  transition: all 0.2s ease !important;
}

.editor-content :deep(.task-checkbox:checked) {
  border-color: #28a745 !important;
  background-color: #28a745 !important;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e") !important;
  background-size: 14px 14px !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}

.editor-content :deep(.task-text) {
  flex: 1 !important;
  outline: none !important;
  padding: 6px 8px !important;
  margin: 0 !important;
  line-height: 1.5 !important;
  border-radius: 4px !important;
  transition: all 0.2s ease !important;
  min-height: 24px !important;
  word-wrap: break-word !important;
}

.editor-content :deep(.task-text:focus) {
  background-color: #f8f9fa !important;
  box-shadow: 0 0 0 2px rgba(0,123,255,.25) !important;
}

.editor-content :deep(li[data-type="taskItem"][data-checked="true"] .task-text) {
  text-decoration: line-through !important;
  opacity: 0.7 !important;
  color: #6c757d !important;
}

.editor-content :deep(.task-counter) {
  font-size: 12px !important;
  color: #6c757d !important;
  margin-bottom: 8px !important;
  font-weight: 500 !important;
  padding: 4px 8px !important;
  background-color: rgba(0,123,255,0.1) !important;
  border-radius: 12px !important;
  display: inline-block !important;
}

/* Plain paragraph styling */
.editor-content :deep(p.plain-paragraph) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 1em 0 !important;
  outline: none !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .task-list-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .toolbar-section {
    justify-content: space-between;
  }
  
  .filter-select, .sort-select {
    min-width: auto;
    flex: 1;
  }
  
  .editor-content :deep(.task-indent-container) {
    padding-left: 0 !important;
  }
  
  .editor-content :deep(li[data-type="taskItem"]) {
    padding: 12px 4px !important;
  }
}

@media (max-width: 480px) {
  .editor-content :deep(.task-text) {
    padding: 8px 4px !important;
    font-size: 14px !important;
  }
  
  .editor-content :deep(.task-checkbox) {
    width: 16px !important;
    height: 16px !important;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .task-list-toolbar {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .filter-select, .sort-select {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .editor-content :deep(li[data-type="taskItem"]:hover) {
    background-color: rgba(255,255,255,0.05) !important;
  }
  
  .editor-content :deep(.task-text:focus) {
    background-color: #2d3748 !important;
  }
}

/* Animation keyframes */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOutUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.editor-content :deep(ul[data-type="taskList"]) {
  animation: slideInDown 0.3s ease-out;
}
</style>
