<template>
  <Button
    variant="ghost"
    size="sm"
    :class="{ 'bg-blue-100': isInCodeBlock() }"
    @mousedown.prevent="handleCodeBlockClick"
    title="Code Block (Ctrl+Shift+C)">
    <FileCode2 class="h-4 w-4" />
  </Button>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { FileCode2 } from "lucide-vue-next";

const editorStore = useEditorStore();

const isInCodeBlock = (): boolean => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  let node = sel.getRangeAt(0).startContainer as HTMLElement | null;
  if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
  while (node && node !== editorStore.editorElement) {
    if (node.tagName === 'PRE') return true;
    node = node.parentElement;
  }
  return false;
};

const handleCodeBlockClick = () => {
  if (!editorStore.editorElement) return;
  editorStore.editorElement.focus();
  if (isInCodeBlock()) {
    exitCodeBlock();
  } else {
    convertToCodeBlock();
  }
  setTimeout(() => editorStore.updateToolbarState(), 10);
};

// Main function: with selection = convert selection; caret = convert block
function convertToCodeBlock() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  if (!range.collapsed) {
    const temp = document.createElement("div");
    temp.appendChild(range.cloneContents());
    const codeHTML = temp.innerText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n/g, "<br>");
    replaceSelectionWithCodeBlock(range, codeHTML);
    return;
  }

  let node = range.startContainer as HTMLElement | null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  while (
    node &&
    node !== editorStore.editorElement &&
    !/^(P|DIV|LI|H[1-6])$/i.test(node.tagName)
  ) {
    node = node.parentElement;
  }
  if (!node || node === editorStore.editorElement) {
    replaceSelectionWithCodeBlock(range, "");
    return;
  }
  const parent = node.parentNode;
  const after = node.nextSibling;
  const codeHTML = node.innerText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "<br>");
  parent.removeChild(node);

  const pre = createStyledPre();
  const code = createStyledCode();
  code.innerHTML = codeHTML;
  pre.appendChild(code);

  if (after) parent.insertBefore(pre, after);
  else parent.appendChild(pre);

  const nextP = document.createElement("p");
  nextP.innerHTML = "<br>";
  pre.parentNode?.insertBefore(nextP, pre.nextSibling);

  placeCaretInCodeBlock(code);
  addCodeBlockKeyHandler(pre, code);
}

function replaceSelectionWithCodeBlock(range: Range, codeHTML: string) {
  const pre = createStyledPre();
  const code = createStyledCode();
  code.innerHTML = codeHTML;
  pre.appendChild(code);

  range.deleteContents();
  range.insertNode(pre);

  const nextP = document.createElement("p");
  nextP.innerHTML = "<br>";
  pre.parentNode?.insertBefore(nextP, pre.nextSibling);

  placeCaretInCodeBlock(code);
  addCodeBlockKeyHandler(pre, code);
}

function placeCaretInCodeBlock(code: HTMLElement) {
  const sel = window.getSelection();
  const newRange = document.createRange();
  newRange.selectNodeContents(code);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
  code.focus();
}

function createStyledPre() {
  const pre = document.createElement("pre");
  pre.className = "custom-code-block";
  Object.assign(pre.style, {
    background: '#f6f8fa',
    border: '1px solid #d1d9e0',
    borderRadius: '6px',
    color: '#0d0d0d',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '14px',
    margin: '1.3rem 0',
    padding: '1rem',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    tabSize: '4'
  });
  return pre;
}
function createStyledCode() {
  const code = document.createElement("code");
  code.className = "custom-code-content";
  Object.assign(code.style, {
    background: 'transparent',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    padding: '0',
    whiteSpace: 'inherit',
    display: 'block',
    outline: 'none',
    minHeight: "1em"
  });
  return code;
}

// ⬇️ KEY HANDLER: includes triple-enter-to-exit logic
function addCodeBlockKeyHandler(pre: HTMLElement, code: HTMLElement) {
  code.onkeydown = (e: KeyboardEvent) => {
    const selection = window.getSelection();
    if (!selection) return;
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      insertAtCaret("  ");
      return;
    }
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      tryUnindent();
      return;
    }
    // -- Triple Enter to Exit Code Block --
    if (e.key === "Enter") {
      setTimeout(() => {
        const text = code.innerText.replace(/\r/g, "");
        const lines = text.split('\n');
        const len = lines.length;
        // If last two lines are both empty (i.e. on third Enter)
        if (
          len >= 3 &&
          lines[len - 1].trim() === "" &&
          lines[len - 2].trim() === ""
        ) {
          // Remove the extra trailing line for clean exit
          let html = code.innerHTML;
          html = html.replace(/(<br>\s*){2}$/, "<br>");
          code.innerHTML = html;

          exitCodeBlockAfter(pre);
        }
      }, 0);
      return;
    }
    // Optionally: ArrowDown/ArrowUp for normal Tiptap displacement
    if (e.key === "ArrowDown") {
      const range = selection.getRangeAt(0);
      if (
        range.endContainer === code &&
        range.endOffset === code.childNodes.length
      ) {
        const lines = code.innerText.replace(/\r/g, "").split('\n');
        if (lines.length && lines[lines.length - 1].trim() === "") {
          e.preventDefault();
          setTimeout(() => {
            if (pre.nextSibling && pre.nextSibling.nodeType === 1) {
              placeCaretAtNodeStart(pre.nextSibling as HTMLElement);
            }
          }, 0);
        }
      }
    }
    if (e.key === "ArrowUp") {
      const range = selection.getRangeAt(0);
      if (range.startContainer === code && range.startOffset === 0) {
        e.preventDefault();
        if (pre.previousSibling && pre.previousSibling.nodeType === 1) {
          placeCaretAtNodeEnd(pre.previousSibling as HTMLElement);
        }
      }
    }
  };
}

function exitCodeBlockAfter(pre: HTMLElement) {
  let nextP = pre.nextSibling as HTMLElement | null;
  if (!nextP || nextP.tagName !== "P") {
    nextP = document.createElement("p");
    nextP.innerHTML = "<br>";
    pre.parentNode?.insertBefore(nextP, pre.nextSibling);
  }
  setTimeout(() => {
    const sel = window.getSelection();
    const r = document.createRange();
    r.setStart(nextP, 0);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
    nextP.focus?.();
  }, 0);
}

function insertAtCaret(text: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}
function tryUnindent() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const code = range.startContainer.nodeType === Node.TEXT_NODE
    ? range.startContainer.parentElement
    : range.startContainer;
  if (!code || code.tagName !== "CODE") return;
  let before = "";
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    before = range.startContainer.textContent?.slice(0, range.startOffset) || "";
  }
  if (before.endsWith("  ")) {
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const txt = range.startContainer as Text;
      txt.deleteData(range.startOffset - 2, 2);
      range.setStart(txt, range.startOffset - 2);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
}
function placeCaretAtNodeStart(node: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  node.focus?.();
}
function placeCaretAtNodeEnd(node: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  node.focus?.();
}

const exitCodeBlock = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  let preElement = sel.getRangeAt(0).startContainer;
  if (preElement.nodeType === Node.TEXT_NODE) preElement = preElement.parentElement;
  while (preElement && preElement !== editorStore.editorElement) {
    if (preElement.tagName === 'PRE') break;
    preElement = preElement.parentElement;
  }
  if (preElement && preElement.tagName === 'PRE' && preElement.parentNode) {
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    preElement.parentNode.insertBefore(p, preElement.nextSibling);
    placeCaretAtNodeStart(p);
  }
};
</script>
