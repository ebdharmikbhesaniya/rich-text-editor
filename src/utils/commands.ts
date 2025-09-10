export function execCommand(
  command: string,
  value: string | null = null
): boolean {
  try {
    // Ensure focus for insert commands
    if (command === "insertHTML" || command === "insertText") {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && activeEl.contentEditable === "true") {
        activeEl.focus();
      }
    }

    const success = document.execCommand(command, false, value);
    console.log(`execCommand ${command}:`, success);
    return success;
  } catch (e) {
    console.warn("execCommand error:", e);
    return false;
  }
}

export function isCommandActive(command: string): boolean {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}

export function isCommandEnabled(command: string): boolean {
  try {
    return document.queryCommandEnabled(command);
  } catch {
    return false;
  }
}
