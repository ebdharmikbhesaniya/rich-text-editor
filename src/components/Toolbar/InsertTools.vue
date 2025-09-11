<template>
  <div class="flex items-center gap-1">
    <TableGridSelector v-if="editorStore.isToolEnabled('table')" />

    <Button
      v-if="editorStore.isToolEnabled('link')"
      variant="ghost"
      size="sm"
      @mousedown="(e: any) => handleLinkClick(e)"
      title="Insert Link (Ctrl+K)">
      <Link class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('horizontalRule')"
      variant="ghost"
      size="sm"
      @mousedown="(e: any) => handleHorizontalRuleClick(e)"
      title="Horizontal Rule">
      <Minus class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { insertLink } from "@/utils/commands";
import { Link, Minus } from "lucide-vue-next";
import TableGridSelector from "./TableGridSelector.vue";

const editorStore = useEditorStore();

// FIXED: Handle link insertion with focus management
const handleLinkClick = (event: MouseEvent) => {
  event.preventDefault();

  editorStore.maintainFocus(() => {
    insertLink();
  });
};

// Handle horizontal rule with focus management
const handleHorizontalRuleClick = (event: MouseEvent) => {
  event.preventDefault();

  editorStore.maintainFocus(() => {
    editorStore.executeCommand("insertHorizontalRule");
  });
};
</script>
