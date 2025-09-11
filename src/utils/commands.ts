export const execCommand = (
  command: string,
  value: string | null = null
): boolean => {
  try {
    const success = document.execCommand(command, false, value);
    console.log(`execCommand ${command}:`, success);
    return success;
  } catch (e) {
    console.warn("execCommand error:", e);
    return false;
  }
};

export const isActive = (command: string): boolean => {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
};

export const getSelectedText = (): string => {
  const selection = window.getSelection();
  return selection ? selection.toString() : "";
};

export const insertLink = () => {
  const selText = getSelectedText();
  const url = prompt("Enter URL", "https://");
  if (!url) return;

  if (selText) {
    execCommand("createLink", url);
  } else {
    const text = prompt("Link text", url) || url;
    execCommand(
      "insertHTML",
      `<a href="${escapeHtmlAttr(
        url
      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`
    );
  }
};

export const escapeHtml = (str: string): string => {
  return String(str).replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ] || s)
  );
};

export const escapeHtmlAttr = (str: string): string =>
  escapeHtml(str).replace(/"/g, "&quot;");
