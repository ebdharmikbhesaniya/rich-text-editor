// Add this to the store state
const emitFunction = ref<Function | null>(null);

// Add this method to set the emit function
const setEmitFunction = (emit: Function) => {
  emitFunction.value = emit;
};

// Update the updateContent method to not require emit parameter
const updateContent = () => {
  const editable = editorAreaRef.value?.editable;
  if (!editable || !emitFunction.value) return;

  const newContent = isCodeView.value
    ? editable.textContent || ""
    : editable.innerHTML;

  content.value = newContent;
  emitFunction.value("update:modelValue", newContent);
  emitFunction.value("change", newContent);
};

// Update all handle methods to not require emit parameter
const handleExecCommand = (command: string, value?: string) => {
  if (isCodeView.value && !["undo", "redo"].includes(command)) return;

  const editable = editorAreaRef.value?.editable;
  if (!editable) {
    console.warn("Editor area ref not available");
    return;
  }

  if (command === "insertHTML" || command === "insertText") {
    editable.focus();
  }

  const success = execCommand(command, value || null);
  if (success) {
    updateContent();
    updateToolbarState();
  }
};

// Update all other handle methods similarly (remove emit parameter)
