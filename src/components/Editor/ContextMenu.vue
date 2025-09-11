<template>
  <Teleport to="body">
    <div
      v-if="editorStore.showContextMenu"
      class="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-1"
      :style="editorStore.contextMenuStyle"
      ref="contextMenuRef">
      <div class="flex items-center gap-1">
        <Button
          v-if="editorStore.isToolEnabled('bold')"
          variant="ghost"
          size="sm"
          :class="{ 'bg-blue-100': isActive('bold') }"
          @mousedown.prevent="() => execCommand('bold')"
          title="Bold">
          <Bold class="h-4 w-4" />
        </Button>

        <Button
          v-if="editorStore.isToolEnabled('italic')"
          variant="ghost"
          size="sm"
          :class="{ 'bg-blue-100': isActive('italic') }"
          @mousedown.prevent="() => execCommand('italic')"
          title="Italic">
          <Italic class="h-4 w-4" />
        </Button>

        <Button
          v-if="editorStore.isToolEnabled('link')"
          variant="ghost"
          size="sm"
          @mousedown.prevent="insertLink"
          title="Link">
          <Link class="h-4 w-4" />
        </Button>

        <Button
          v-if="editorStore.isToolEnabled('highlight')"
          variant="ghost"
          size="sm"
          @mousedown.prevent="applyHighlight"
          title="Highlight">
          <Highlighter class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useEditorStore } from "@/stores/editorStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { execCommand, isActive, insertLink } from "@/utils/commands";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Link, Highlighter } from "lucide-vue-next";

const contextMenuRef = ref<HTMLElement>();
const editorStore = useEditorStore();
const toolbarStore = useToolbarStore();

const applyHighlight = () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const color = toolbarStore.currentHighlightColor;
  if (color === "transparent") {
    execCommand("hiliteColor", "transparent");
    execCommand("backColor", "transparent");
  } else {
    execCommand("hiliteColor", color);
    if (!document.queryCommandSupported("hiliteColor")) {
      execCommand("backColor", color);
    }
  }

  editorStore.showContextMenu = false;
};
</script>
