import { useEditorStore } from "@/stores/editorStore";

// FIXED: Enhanced execCommand with proper undo/redo handling
export function execCommand(command: string, value: any = null): boolean {
  const editorStore = useEditorStore();

  // Allow undo/redo in both views
  if (command === "undo" || command === "redo") {
    try {
      const success = document.execCommand(command, false, value);
      console.log(`execCommand ${command}:`, success);

      // Update content and state after undo/redo
      setTimeout(() => {
        editorStore.updateToolbarState();
      }, 10);

      return success;
    } catch (e) {
      console.warn("execCommand error:", e);
      return false;
    }
  }

  // For other commands, don't allow in code view
  if (editorStore.isCodeView && !["undo", "redo"].includes(command))
    return false;

  try {
    // Ensure editor has focus for insertion commands
    if (
      editorStore.editorElement &&
      (command === "insertHTML" || command === "insertText")
    ) {
      editorStore.editorElement.focus();
    }

    const success = document.execCommand(command, false, value);
    console.log(`execCommand ${command}:`, success);

    if (success) {
      editorStore.updateToolbarState();
    }

    return success;
  } catch (e) {
    console.warn("execCommand error:", e);
    return false;
  }
}

export function isActive(command: string): boolean {
  const editorStore = useEditorStore();
  if (editorStore.isCodeView) return false;
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}

export function insertLink(): void {
  const editorStore = useEditorStore();
  const selection = window.getSelection();
  const selectedText = selection ? selection.toString() : "";

  const url = prompt("Enter URL", "https://");
  if (!url) return;

  if (selectedText) {
    execCommand("createLink", url);
  } else {
    const text = prompt("Link text", url) || url;
    const escapedUrl = escapeHtmlAttr(url);
    const escapedText = escapeHtml(text);
    execCommand(
      "insertHTML",
      `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedText}</a>`
    );
  }

  editorStore.updateToolbarState();
}

function escapeHtml(str: string): string {
  return String(str).replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ] || s)
  );
}

function escapeHtmlAttr(str: string): string {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
