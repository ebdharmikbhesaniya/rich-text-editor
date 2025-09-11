<template>
  <div class="flex items-center gap-1">
    <Button
      v-if="editorStore.isToolEnabled('undo')"
      variant="ghost"
      size="sm"
      :disabled="!editorStore.canUndo"
      @mousedown="(e:any) => handleHistoryClick(e, 'undo')"
      title="Undo (Ctrl+Z)">
      <Undo class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('redo')"
      variant="ghost"
      size="sm"
      :disabled="!editorStore.canRedo"
      @mousedown="(e:any) => handleHistoryClick(e, 'redo')"
      title="Redo (Ctrl+Shift+Z)">
      <Redo class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { Redo, Undo } from "lucide-vue-next";

const editorStore = useEditorStore();

// FIXED: History commands with proper focus
const handleHistoryClick = (event: MouseEvent, command: string) => {
  event.preventDefault();

  editorStore.maintainFocus(() => {
    editorStore.executeCommand(command);
  });
};
</script>
