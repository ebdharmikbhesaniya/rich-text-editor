<template>
  <div class="ck-editor__main">
    <div
      ref="editable"
      class="ck-content ck-editor__editable"
      :class="{ 'ck-code-view': isCodeView }"
      contenteditable="true"
      spellcheck="true"
      role="textbox"
      aria-label="Rich text editor"
      @input="handleInput"
      @keydown="$emit('keydown', $event)"
      @keyup="$emit('keyup', $event)"
      @mouseup="$emit('mouseup', $event)"
      @focus="handleFocus"
      @blur="handleBlur"
      @paste="$emit('paste', $event)"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
  modelValue: string;
  isCodeView: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  input: [event: Event];
  keydown: [event: KeyboardEvent];
  keyup: [event: KeyboardEvent];
  mouseup: [event: MouseEvent];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  paste: [event: ClipboardEvent];
}>();

const editable = ref<HTMLElement>();

const handleInput = (event: Event) => {
  if (!editable.value) return;

  const content = props.isCodeView
    ? editable.value.textContent || ""
    : editable.value.innerHTML;

  emit("update:modelValue", content);
  emit("input", event);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const handleBlur = (event: FocusEvent) => {
  cleanupTrailingEmptyContent();
  emit("blur", event);
};

const cleanupTrailingEmptyContent = () => {
  if (!editable.value) return;

  if (props.isCodeView) {
    // For code view, just trim trailing whitespace
    const content = editable.value.textContent || "";
    const trimmed = content.replace(/\s+$/, "");
    if (content !== trimmed) {
      editable.value.textContent = trimmed;
      handleInput(new Event("input"));
    }
    return;
  }

  // For HTML view, remove trailing empty elements
  const container = editable.value;
  let hasChanges = false;

  // Remove trailing empty paragraphs, divs, and br tags
  while (container.lastElementChild) {
    const lastElement = container.lastElementChild;
    const tagName = lastElement.tagName.toLowerCase();

    // Check if element is effectively empty
    const textContent = lastElement.textContent || "";
    const innerHTML = lastElement.innerHTML || "";

    const isEmpty =
      textContent.trim() === "" ||
      innerHTML === "<br>" ||
      innerHTML === "&nbsp;" ||
      innerHTML === "" ||
      /^(\s|&nbsp;|<br\s*\/??>)*$/.test(innerHTML);

    if ((tagName === "p" || tagName === "div" || tagName === "br") && isEmpty) {
      container.removeChild(lastElement);
      hasChanges = true;
    } else {
      break;
    }
  }

  // Ensure there's at least one paragraph
  if (!container.children.length || container.innerHTML.trim() === "") {
    container.innerHTML = "<p></p>";
    hasChanges = true;
  }

  // Update content if changes were made
  if (hasChanges) {
    handleInput(new Event("input"));
  }
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (!editable.value) return;

    const current = props.isCodeView
      ? editable.value.textContent || ""
      : editable.value.innerHTML;

    if (newVal !== current) {
      if (props.isCodeView) {
        editable.value.textContent = newVal;
      } else {
        editable.value.innerHTML = newVal || "<p></p>";
      }
    }
  }
);

watch(
  () => props.isCodeView,
  (isCodeView) => {
    if (!editable.value) return;

    if (isCodeView) {
      // Switch to code view
      editable.value.textContent = editable.value.innerHTML;
    } else {
      // Switch to HTML view
      editable.value.innerHTML = editable.value.textContent || "<p></p>";
    }

    handleInput(new Event("input"));
  }
);

onMounted(() => {
  if (!editable.value) return;

  const initialContent = props.modelValue || "<p></p>";
  if (props.isCodeView) {
    editable.value.textContent = initialContent;
  } else {
    editable.value.innerHTML = initialContent;
  }
});

// Expose the editable element for parent access
defineExpose({
  editable,
});
</script>

<style scoped>
.ck-editor__main {
  position: relative;
}

.ck-content {
  min-height: 260px;
  padding: 20px;
  outline: none;
  overflow-wrap: break-word;
  background: transparent;
}

.ck-content.ck-code-view {
  font-family: "Courier New", monospace;
  white-space: pre-wrap;
  background: hsl(0, 0%, 98%);
  padding: 16px;
}

.ck-content p {
  margin: 0 0 1em 0;
}

.ck-content img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 8px 0;
}

.ck-content mark,
.ck-content [style*="background-color"] {
  padding: 1px 2px;
  border-radius: 2px;
}

.ck-content sup {
  font-size: 0.75em;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
  top: -0.5em;
}

.ck-content sub {
  font-size: 0.75em;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
  bottom: -0.25em;
}

.ck-content table {
  table-layout: fixed !important;
  width: 100% !important;
  border-collapse: collapse !important;
  margin: 1em 0 !important;
}

.ck-content table td,
.ck-content table th {
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  vertical-align: top !important;
  min-height: 20px !important;
  position: relative !important;
}

.ck-content table td:empty::before,
.ck-content table th:empty::before {
  content: "\00a0";
  color: transparent;
}

.ck-content table {
  min-width: 200px !important;
}

.ck-content table td,
.ck-content table th {
  word-break: break-word !important;
  hyphens: auto !important;
}
</style>
