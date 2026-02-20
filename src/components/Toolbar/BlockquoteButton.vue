<template>
  <Button
    variant="ghost"
    size="sm"
    :class="{ 'bg-blue-100': isInBlockquote }"
    @mousedown.prevent="onBlockquoteBtn"
    title="Blockquote (Ctrl+Alt+Q)"
  >
    <TextQuote class="h-4 w-4" />
  </Button>
</template>

<script setup lang="ts">
/**
 * TipTap-like Blockquote behavior:
 * - Wrap selected content (or current block/line) into <blockquote>.
 * - Each line inside blockquote is a <div> (so Enter creates a new <div>).
 * - Enter on an empty line exits blockquote and puts caret into a new <p> after it.
 * - Shift+Enter inserts a soft <br> inside the current line.
 *
 * Uses requestAnimationFrame to reliably place caret after browser restores selection.
 */
import { Button } from "@/components/ui/button";
import { TextQuote } from "lucide-vue-next";
import { ref, onMounted, onUnmounted } from "vue";
import { useEditorStore } from "@/stores/editorStore";

const editorStore = useEditorStore();
const isInBlockquote = ref(false);

// ------------------------- Utilities -------------------------
function getSelectionSafe() {
  const sel = window.getSelection();
  if (!sel) return null;
  if (sel.rangeCount === 0) return null;
  return sel;
}

function createStyledBlockquote() {
  const el = document.createElement("blockquote");
  Object.assign(el.style, {
    borderLeft: "4px solid #000",
    background: "#fff",
    color: "#1a1a1a",
    margin: "1.5rem 0",
    padding: "0.75rem 1.25rem",
    fontSize: "1.07em",
    lineHeight: "1.7",
    borderRadius: "6px",
    fontStyle: "italic",
    minHeight: "1.5em",
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
  });
  el.setAttribute("contenteditable", "true");
  return el;
}

function createLineDiv(html = "<br>") {
  const d = document.createElement("div");
  // Keep block-style lines inside blockquote
  d.innerHTML = html;
  return d;
}

function placeCaretInNode(node: Node, offset = 0) {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  // if node is element, try to place inside its first text child
  if (node.nodeType === Node.ELEMENT_NODE) {
    const first = node.firstChild || node.appendChild(document.createTextNode(""));
    r.setStart(first, Math.min(offset, (first.nodeValue || "").length));
  } else {
    r.setStart(node, offset);
  }
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

// ------------------------- State detection -------------------------
function updateIsInBlockquote() {
  const sel = getSelectionSafe();
  if (!sel) {
    isInBlockquote.value = false;
    return;
  }
  let node = sel.getRangeAt(0).startContainer as Node | null;
  if (!node) {
    isInBlockquote.value = false;
    return;
  }
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  while (node && node !== editorStore.editorElement) {
    if ((node as HTMLElement).tagName === "BLOCKQUOTE") {
      isInBlockquote.value = true;
      return;
    }
    node = (node as Node).parentElement;
  }
  isInBlockquote.value = false;
}

// ------------------------- Toggle / Wrap / Unwrap -------------------------
function onBlockquoteBtn() {
  if (!editorStore.editorElement) return;
  editorStore.editorElement.focus();
  if (isInBlockquote.value) {
    unwrapBlockquoteAtCursor();
  } else {
    wrapSelectionOrLineInBlockquote();
  }
  // update state slightly after DOM changes
  setTimeout(updateIsInBlockquote, 20);
}

/** Wrap selection (multi-node) or current block into a blockquote.
 * When selection spans multiple block elements, create a blockquote and move each block as a <div> inside it.
 * If selection is collapsed, wrap the current block/line.
 */
function wrapSelectionOrLineInBlockquote() {
  const sel = getSelectionSafe();
  if (!sel) return;
  const range = sel.getRangeAt(0);

  const blockquote = createStyledBlockquote();

  if (!sel.isCollapsed) {
    // Extract the selected content and place inside blockquote
    const frag = range.extractContents();

    // Normalize frag into line <div>s:
    // If frag has block-level children, use them. Otherwise, split by line breaks into divs.
    const temp = document.createElement("div");
    temp.appendChild(frag);

    // If temp contains block children (p/div/li/blockquote/h1-6), convert each to a line div preserving innerHTML
    const blockChildren = Array.from(temp.childNodes).filter((n) =>
      n.nodeType === Node.ELEMENT_NODE &&
      /^(P|DIV|LI|BLOCKQUOTE|H[1-6])$/i.test((n as HTMLElement).tagName)
    );

    if (blockChildren.length > 0) {
      blockChildren.forEach((n) => {
        const d = createLineDiv((n as HTMLElement).innerHTML || "<br>");
        blockquote.appendChild(d);
      });
    } else {
      // No block children => treat the whole fragment as single/possibly multi-line text.
      // Split on <br> and create line divs.
      const html = temp.innerHTML;
      const parts = html.split(/<br\s*\/?>/i);
      parts.forEach((p, i) => {
        const content = p.trim() === "" ? "<br>" : p;
        blockquote.appendChild(createLineDiv(content));
      });
    }

    // Insert blockquote at range's position
    range.insertNode(blockquote);

    // Place caret at end of last inserted line
    requestAnimationFrame(() => {
      const last = blockquote.lastChild || blockquote;
      placeCaretInNode(last.firstChild || last, 0);
      updateIsInBlockquote();
    });
  } else {
    // collapsed selection -> wrap current block/line
    let node = range.startContainer as Node;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement as Node;

    // Try to find the nearest block-like ancestor (p, div, li, h1-6)
    const block = (node as HTMLElement).closest
      ? (node as HTMLElement).closest("p,div,li,h1,h2,h3,h4,h5,h6")
      : null;

    if (block && block !== editorStore.editorElement) {
      // Replace the block with a blockquote; keep innerHTML as single line div inside
      const line = createLineDiv((block as HTMLElement).innerHTML || "<br>");
      blockquote.appendChild(line);
      (block as HTMLElement).replaceWith(blockquote);

      requestAnimationFrame(() => {
        placeCaretInNode(line.firstChild || line, 0);
        updateIsInBlockquote();
      });
    } else {
      // No surrounding block found: just insert a new empty blockquote with one line
      const line = createLineDiv("<br>");
      blockquote.appendChild(line);
      range.insertNode(blockquote);
      requestAnimationFrame(() => {
        placeCaretInNode(line.firstChild || line, 0);
        updateIsInBlockquote();
      });
    }
  }
}

/** Unwrap blockquote at cursor (replace with paragraph or keep content) */
function unwrapBlockquoteAtCursor() {
  const sel = getSelectionSafe();
  if (!sel) return;
  let node = sel.getRangeAt(0).startContainer as Node;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement as Node;

  // find ancestor blockquote
  let bq: Node | null = node;
  while (bq && bq !== editorStore.editorElement && (bq as HTMLElement).tagName !== "BLOCKQUOTE") {
    bq = (bq as Node).parentElement;
  }
  if (!bq || (bq as HTMLElement).tagName !== "BLOCKQUOTE") return;

  // Convert blockquote's lines to a simple paragraph preserving newlines
  const paragraph = document.createElement("p");
  const innerParts: string[] = [];
  Array.from((bq as HTMLElement).childNodes).forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      innerParts.push((child as HTMLElement).innerHTML || "");
    } else {
      innerParts.push(child.textContent || "");
    }
  });
  paragraph.innerHTML = innerParts.length ? innerParts.join("<br>") : "<br>";
  (bq as HTMLElement).replaceWith(paragraph);

  requestAnimationFrame(() => {
    // caret at paragraph start
    placeCaretInNode(paragraph.firstChild || paragraph, 0);
    updateIsInBlockquote();
  });
}

// ------------------------- Handle Enter / Shift+Enter -------------------------
function handleSmartEnter(e: KeyboardEvent) {
  // We always handle Shift+Enter and Enter only inside blockquote
  const sel = getSelectionSafe();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  // find blockquote ancestor
  let node = range.startContainer as Node;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement as Node;

  let bq: Node | null = node;
  while (bq && bq !== editorStore.editorElement && (bq as HTMLElement).tagName !== "BLOCKQUOTE") {
    bq = (bq as Node).parentElement;
  }
  const insideBq = !!bq && (bq as HTMLElement).tagName === "BLOCKQUOTE";
  if (!insideBq) return; // only handle when inside a blockquote

  // If Shift+Enter -> soft break <br> inside current line
  if (e.shiftKey) {
    e.preventDefault();
    // insert <br> at caret position in the text node or element
    const br = document.createElement("br");
    range.deleteContents();
    range.insertNode(br);
    // move caret after br
    requestAnimationFrame(() => {
      const after = br.nextSibling || br.parentElement?.nextSibling || br.parentElement;
      if (after) placeCaretInNode(after, 0);
      updateIsInBlockquote();
    });
    return;
  }

  // Normal Enter: either create new line div inside blockquote OR exit when current line empty
  e.preventDefault();

  // determine current line element: nearest child of blockquote (div) or the blockquote itself
  let line = range.startContainer as Node;
  if (line.nodeType === Node.TEXT_NODE) line = line.parentElement as Node;
  // ascend until direct child of blockquote (or blockquote itself)
  while (line && line.parentElement !== bq && line !== bq) {
    line = (line as Node).parentElement as Node;
  }
  if (!line) line = bq as Node;

  // check emptiness of the line (ignore <br> and &nbsp;)
  const lineText = (line.textContent || "").replace(/\u200B/g, "").trim();
  const lineHtmlStr = (line as HTMLElement).innerHTML || "";
  const isEmptyLine = lineText === "" && lineHtmlStr.replace(/<br\s*\/?>|&nbsp;/gi, "").trim() === "";

  if (isEmptyLine) {
    // Exit blockquote: create paragraph after blockquote and place caret there
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<br>";

    // insert after blockquote
    (bq as HTMLElement).insertAdjacentElement("afterend", paragraph);

    // remove the empty line node if it was a wrapper
    if (line.parentElement === bq) {
      line.parentElement?.removeChild(line);
    }

    // if blockquote now empty -> remove it
    if ((bq as HTMLElement).textContent?.trim() === "") {
      (bq as HTMLElement).remove();
    }

    requestAnimationFrame(() => {
      placeCaretInNode(paragraph.firstChild || paragraph, 0);
      updateIsInBlockquote();
    });
    return;
  } else {
    // Continue inside blockquote: insert a new line <div> after current line and place caret
    const newLine = createLineDiv("<br>");
    // If current line is the blockquote itself (no inner divs), append; else insert after
    if (line === bq) {
      (bq as HTMLElement).appendChild(newLine);
    } else {
      (line as Node).insertAdjacentElement("afterend", newLine);
    }

    requestAnimationFrame(() => {
      placeCaretInNode(newLine.firstChild || newLine, 0);
      updateIsInBlockquote();
    });
    return;
  }
}

// ------------------------- Lifecycle -------------------------
onMounted(() => {
  if (editorStore.editorElement) {
    editorStore.editorElement.addEventListener("keydown", handleSmartEnter);
    editorStore.editorElement.addEventListener("keyup", updateIsInBlockquote);
    editorStore.editorElement.addEventListener("click", updateIsInBlockquote);
    // update once on mount
    setTimeout(updateIsInBlockquote, 50);
  }
});

onUnmounted(() => {
  if (editorStore.editorElement) {
    editorStore.editorElement.removeEventListener("keydown", handleSmartEnter);
    editorStore.editorElement.removeEventListener("keyup", updateIsInBlockquote);
    editorStore.editorElement.removeEventListener("click", updateIsInBlockquote);
  }
});
</script>