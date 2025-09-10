<template>
  <div class="ck-toolbar" role="toolbar" aria-label="Editor toolbar">
    <!-- History Tools -->
    <div class="ck-toolbar__group" v-if="hasHistoryTools">
      <tool-button
        v-if="tools.includes('undo')"
        :disabled="!editorStore.canUndo"
        title="Undo (Ctrl+Z)"
        @execute="editorStore.handleExecCommand('undo')">
        <Undo />
      </tool-button>
      <tool-button
        v-if="tools.includes('redo')"
        :disabled="!editorStore.canRedo"
        title="Redo (Ctrl+Shift+Z)"
        @execute="editorStore.handleExecCommand('redo')">
        <Redo />
      </tool-button>
    </div>

    <span
      class="ck-toolbar__separator"
      v-if="hasHistoryTools && hasOtherTools" />

    <!-- Heading Tool -->
    <heading-tool
      v-if="tools.includes('heading')"
      @changeHeading="$emit('changeHeading', $event)" />

    <span
      class="ck-toolbar__separator"
      v-if="tools.includes('heading') && hasFormattingTools" />

    <!-- Text Formatting Tools -->
    <text-formatting-tools
      v-if="hasFormattingTools"
      :tools="tools"
      :activeStates="editorStore.activeStates"
      @execCommand="$emit('execCommand', $event)" />

    <span
      class="ck-toolbar__separator"
      v-if="hasFormattingTools && hasColorTools" />

    <!-- Color Tools -->
    <color-tool
      v-if="hasColorTools"
      :tools="tools"
      :currentTextColor="editorStore.currentTextColor"
      :currentHighlightColor="editorStore.currentHighlightColor"
      @changeTextColor="$emit('changeTextColor', $event)"
      @applyHighlight="$emit('applyHighlight', $event)" />

    <span class="ck-toolbar__separator" v-if="hasColorTools && hasTableTools" />

    <!-- Table Tool -->
    Hello
    <table-tool
      v-if="hasTableTools"
      :currentTableHeaderColor="editorStore.currentTableHeaderColor"
      :isInTableCell="editorStore.isInTableCell"
      @insertTableRow="$emit('insertTableRow', $event)"
      @deleteTableRow="$emit('deleteTableRow')"
      @insertTableColumn="$emit('insertTableColumn', $event)"
      @deleteTableColumn="$emit('deleteTableColumn')"
      @changeTableHeaderColor="$emit('changeTableHeaderColor', $event)"
      @toggleTableHeader="$emit('toggleTableHeader')"
      @showCustomTableDialog="$emit('showCustomTableDialog')" />
    Hey
    <!-- @createTableFromGrid="$emit('createTableFromGrid', $event)" -->
    <span
      class="ck-toolbar__separator"
      v-if="hasTableTools && hasInsertTools" />

    <!-- Insert Tools -->
    <div class="ck-toolbar__group" v-if="hasInsertTools">
      <tool-button
        v-if="tools.includes('insertLink')"
        title="Insert Link (Ctrl+K)"
        @execute="$emit('insertLink')">
        <Link />
      </tool-button>

      <tool-button
        v-if="tools.includes('insertHorizontalRule')"
        title="Horizontal Rule"
        @execute="$emit('execCommand', 'insertHorizontalRule')">
        <Minus />
      </tool-button>

      <!-- TODO: add horishontel rules this one is missing -->
    </div>

    <span class="ck-toolbar__separator" v-if="hasInsertTools && hasListTools" />

    <!-- List Tools -->
    <list-tools
      v-if="hasListTools"
      :tools="tools"
      :activeStates="editorStore.activeStates"
      @execCommand="$emit('execCommand', $event)" />

    <span
      class="ck-toolbar__separator"
      v-if="hasListTools && hasAlignmentTools" />

    <!-- Alignment Tools -->
    <alignment-tools
      v-if="hasAlignmentTools"
      :tools="tools"
      :activeStates="editorStore.activeStates"
      @execCommand="$emit('execCommand', $event)" />

    <span
      class="ck-toolbar__separator"
      v-if="hasAlignmentTools && tools.includes('codeView')" />

    <!-- Code View Toggle -->
    <div class="ck-toolbar__group" v-if="tools.includes('codeView')">
      <tool-button
        :isActive="editorStore.isCodeView"
        title="Source Code View"
        @execute="editorStore.handleToggleCodeView">
        <CodeBrackets />
      </tool-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted } from "vue";
import type { ToolName } from "../../types";
import ToolButton from "./ToolButton.vue";
import HeadingTool from "./tools/HeadingTool.vue";
import TextFormattingTools from "./tools/TextFormattingTools.vue";
import ColorTool from "./tools/ColorTool.vue";
import TableTool from "./tools/TableTool.vue";
import ListTools from "./tools/ListTools.vue";
import AlignmentTools from "./tools/AlignmentTools.vue";
import { CodeBrackets, Link, Minus, Redo, Undo } from "@iconoir/vue";
import { useEditorStore } from "../../stores/editorStore";

const editorStore = useEditorStore();

// Inject the editorAreaRef from parent
const editorAreaRef = inject("editorAreaRef");

// Ensure the store has the ref when toolbar mounts
onMounted(() => {
  if (editorAreaRef) {
    editorStore.setEditorAreaRef(editorAreaRef);
  }
});

const tools = computed(() =>
  editorStore.tools && editorStore.tools.length > 0
    ? editorStore.tools
    : (["bold", "italic", "underline", "heading"] as ToolName[])
);

// Helper computed properties to determine what separators to show
const hasHistoryTools = computed(() =>
  tools.value.some((tool) => ["undo", "redo"].includes(tool))
);

const hasFormattingTools = computed(() =>
  tools.value.some((tool) =>
    [
      "bold",
      "italic",
      "underline",
      "strikeThrough",
      "superscript",
      "subscript",
    ].includes(tool)
  )
);

const hasColorTools = computed(() =>
  tools.value.some((tool) => ["foreColor", "highlight"].includes(tool))
);

const hasTableTools = computed(() => tools.value.includes("table"));

const hasInsertTools = computed(() =>
  tools.value.some((tool) =>
    ["insertLink", "insertHorizontalRule"].includes(tool)
  )
);

const hasListTools = computed(() =>
  tools.value.some((tool) =>
    ["insertUnorderedList", "insertOrderedList"].includes(tool)
  )
);

const hasAlignmentTools = computed(() =>
  tools.value.some((tool) =>
    ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"].includes(
      tool
    )
  )
);

const hasOtherTools = computed(
  () =>
    hasFormattingTools.value ||
    hasColorTools.value ||
    hasTableTools.value ||
    hasInsertTools.value ||
    hasListTools.value ||
    hasAlignmentTools.value ||
    tools.value.includes("codeView")
);
</script>

<style scoped>
.ck-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px;
  background: hsl(0, 0%, 98%);
  border-bottom: 1px solid hsl(0, 0%, 92%);
  gap: 6px;
}

.ck-toolbar__group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ck-toolbar__separator {
  width: 1px;
  height: 20px;
  background: hsl(0, 0%, 92%);
  margin: 0 8px;
}
</style>
