<template>
  <div class="flex items-center gap-1">
    <Button
      v-if="editorStore.isToolEnabled('bulletList')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isInList('ul') }"
      @mousedown="(e: any) => handleListClick(e, 'bullet')"
      title="Bulleted List">
      <List class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('numberedList')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isInList('ol') }"
      @mousedown="(e: any) => handleListClick(e, 'numbered')"
      title="Numbered List">
      <ListOrdered class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { List, ListOrdered } from "lucide-vue-next";

const editorStore = useEditorStore();

// Check if cursor is currently in a list
const isInList = (listType: "ul" | "ol"): boolean => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  let node = selection.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editorStore.editorElement) {
    if ((node as Element).tagName?.toLowerCase() === listType) {
      return true;
    }
    node = (node as Element).parentElement;
  }

  return false;
};

// FIXED: Complete manual list implementation
const handleListClick = (
  event: MouseEvent,
  listType: "bullet" | "numbered"
) => {
  event.preventDefault();

  if (!editorStore.editorElement) return;

  // Focus the editor
  editorStore.editorElement.focus();

  const selection = window.getSelection();
  if (!selection) return;

  // Save current cursor position
  let range: Range;
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
  } else {
    // Create range at end of editor if no selection
    range = document.createRange();
    range.setStart(
      editorStore.editorElement,
      editorStore.editorElement.childNodes.length
    );
    range.collapse(true);
  }

  const htmlListType = listType === "bullet" ? "ul" : "ol";
  const currentlyInList = isInList(htmlListType);

  if (currentlyInList) {
    // Remove from list
    removeFromList(range, selection);
  } else {
    // Create new list
    createList(range, selection, htmlListType);
  }

  // Update toolbar state
  setTimeout(() => {
    editorStore.updateToolbarState();
  }, 10);
};

// Function to create a new list
const createList = (
  range: Range,
  selection: Selection,
  listType: "ul" | "ol"
) => {
  const selectedText = selection.toString().trim();

  // Create list elements
  const listElement = document.createElement(listType);
  const listItem = document.createElement("li");

  // Style the list
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
    // Use selected text
    listItem.textContent = selectedText;
    range.deleteContents();
  } else {
    // Create empty list item with placeholder
    listItem.innerHTML = "&nbsp;";
  }

  listElement.appendChild(listItem);

  // Insert the list
  range.insertNode(listElement);

  // Add a paragraph after the list for continued typing
  const followingParagraph = document.createElement("p");
  followingParagraph.innerHTML = "<br>";
  listElement.parentNode?.insertBefore(
    followingParagraph,
    listElement.nextSibling
  );

  // Place cursor inside the list item
  const newRange = document.createRange();
  if (selectedText) {
    newRange.setStart(listItem.firstChild!, listItem.textContent!.length);
  } else {
    newRange.setStart(listItem, 0);
  }
  newRange.collapse(true);

  selection.removeAllRanges();
  selection.addRange(newRange);

  // Focus the list item
  listItem.focus();
};

// Function to remove from list
const removeFromList = (range: Range, selection: Selection) => {
  let node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement!;
  }

  // Find the list item
  while (node && node !== editorStore.editorElement) {
    if ((node as Element).tagName === "LI") {
      const listItem = node as HTMLElement;
      const list = listItem.parentElement;
      const listContent = listItem.innerHTML;

      // Create a paragraph with the list item content
      const paragraph = document.createElement("p");
      paragraph.innerHTML = listContent || "&nbsp;";
      paragraph.style.margin = "1em 0";

      // Insert paragraph before the list
      list?.parentNode?.insertBefore(paragraph, list);

      // Remove the list item
      listItem.remove();

      // If list is now empty, remove it
      if (list && list.children.length === 0) {
        list.remove();
      }

      // Place cursor in the new paragraph
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
</script>

<style scoped>
/* ... existing styles ... */

/* Proper list styling */
.editor-content :deep(ul),
.editor-content :deep(ol) {
  margin: 1em 0 !important;
  padding-left: 1.5em !important;
  list-style-position: outside !important;
}

.editor-content :deep(ul) {
  list-style-type: disc !important;
}

.editor-content :deep(ol) {
  list-style-type: decimal !important;
}

.editor-content :deep(li) {
  margin: 0.25em 0 !important;
  padding: 0 !important;
  line-height: 1.5 !important;
  display: list-item !important;
}

.editor-content :deep(ul li) {
  list-style-type: disc !important;
}

.editor-content :deep(ol li) {
  list-style-type: decimal !important;
}

/* Nested lists */
.editor-content :deep(ul ul),
.editor-content :deep(ol ol),
.editor-content :deep(ul ol),
.editor-content :deep(ol ul) {
  margin: 0.5em 0 !important;
  padding-left: 1.2em !important;
}

.editor-content :deep(ul ul li) {
  list-style-type: circle !important;
}

.editor-content :deep(ul ul ul li) {
  list-style-type: square !important;
}

/* Code view list styling */
.editor-content.font-mono :deep(ul),
.editor-content.font-mono :deep(ol) {
  font-family: "Courier New", monospace !important;
}
</style>
