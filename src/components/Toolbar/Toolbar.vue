<template>
  <div
    class="toolbar flex items-center flex-wrap gap-2 p-2 bg-gray-50 border-b border-gray-200">
    <HistoryButtons v-if="showHistoryButtons" />

    <div v-if="showSeparator('history')" class="toolbar-separator" />

    <HeadingDropdown v-if="editorStore.isToolEnabled('heading')" />

    <div v-if="showSeparator('heading')" class="toolbar-separator" />

    <FormatButtons />

    <div v-if="showSeparator('format')" class="toolbar-separator" />

    <ColorPicker v-if="editorStore.isToolEnabled('fontColor')" />
    <HighlightPicker v-if="editorStore.isToolEnabled('highlight')" />
    <TableTools v-if="editorStore.isToolEnabled('table')" />

    <div v-if="showSeparator('color')" class="toolbar-separator" />

    <InsertTools />

    <div v-if="showSeparator('insert')" class="toolbar-separator" />

    <ListButtons />

    <div v-if="showSeparator('list')" class="toolbar-separator" />

    <AlignmentButtons />

    <div v-if="showSeparator('align')" class="toolbar-separator" />

    <ViewToggle v-if="editorStore.isToolEnabled('codeView')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEditorStore } from "@/stores/editorStore";
import HistoryButtons from "./HistoryButtons.vue";
import HeadingDropdown from "./HeadingDropdown.vue";
import FormatButtons from "./FormatButtons.vue";
import ColorPicker from "./ColorPicker.vue";
import HighlightPicker from "./HighlightPicker.vue";
import TableTools from "./TableTools.vue";
import InsertTools from "./InsertTools.vue";
import ListButtons from "./ListButtons.vue";
import AlignmentButtons from "./AlignmentButtons.vue";
import ViewToggle from "./ViewToggle.vue";

const editorStore = useEditorStore();

const showHistoryButtons = computed(
  () => editorStore.isToolEnabled("undo") || editorStore.isToolEnabled("redo")
);

const showSeparator = (section: string) => {
  // Logic to determine when to show separators between toolbar sections
  return true; // Simplified for now
};
</script>

<style scoped>
.toolbar-separator {
  width: 1px;
  height: 20px;
  background: rgb(229 231 235);
  margin: 0 4px;
}
</style>
