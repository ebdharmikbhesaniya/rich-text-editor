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
  // const editorStore = useEditorStore();
  // if (editorStore.isCodeView) return false;
  try {
    console.log("test --->", document.queryCommandState(command));

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

  // FIXED: Enhanced link styling with color and underline
  const linkStyle = `
    color: #2563eb;
    text-decoration: underline;
    text-decoration-color: #2563eb;
    text-underline-offset: 2px;
    transition: all 0.2s ease;
  `
    .replace(/\s+/g, " ")
    .trim();

  // const hoverStyle = `
  //   color: #1d4ed8;
  //   text-decoration-color: #1d4ed8;
  // `;

  if (selectedText) {
    // Create link from selected text
    execCommand("createLink", url);

    // Apply custom styling to the newly created link
    setTimeout(() => {
      if (!editorStore.editorElement) return;

      // Find the newly created link and apply styling
      const links = editorStore.editorElement.querySelectorAll("a");
      const targetLink = Array.from(links).find(
        (link) =>
          link.getAttribute("href") === url && link.textContent === selectedText
      );

      if (targetLink) {
        applyLinkStyling(targetLink as HTMLAnchorElement, linkStyle);
      }
    }, 10);
  } else {
    // Create new link with custom text
    const text = prompt("Link text", url) || url;
    const escapedUrl = escapeHtmlAttr(url);
    const escapedText = escapeHtml(text);

    const linkHTML = `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}" class="editor-link">${escapedText}</a>`;

    execCommand("insertHTML", linkHTML);

    // Apply hover effects after insertion
    setTimeout(() => {
      applyLinkHoverEffects();
    }, 10);
  }

  editorStore.updateToolbarState();
}

function applyLinkStyling(link: HTMLAnchorElement, style: string) {
  // Apply inline styles
  link.setAttribute("style", style);
  link.setAttribute("class", "editor-link");
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener noreferrer");
}

// Helper function to apply hover effects to all links
function applyLinkHoverEffects() {
  const editorStore = useEditorStore();
  if (!editorStore.editorElement) return;

  const links = editorStore.editorElement.querySelectorAll("a.editor-link");
  links.forEach((link) => {
    const htmlLink = link as HTMLAnchorElement;

    // Add hover event listeners
    htmlLink.addEventListener("mouseenter", () => {
      htmlLink.style.color = "#1d4ed8";
      htmlLink.style.textDecorationColor = "#1d4ed8";
      htmlLink.style.transform = "translateY(-1px)";
    });

    htmlLink.addEventListener("mouseleave", () => {
      htmlLink.style.color = "#2563eb";
      htmlLink.style.textDecorationColor = "#2563eb";
      htmlLink.style.transform = "translateY(0)";
    });
  });
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
