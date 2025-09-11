<template>
  <div class="flex items-center gap-1">
    <Button
      v-if="editorStore.isToolEnabled('undo')"
      variant="ghost"
      size="sm"
      :disabled="!editorStore.canUndo"
      @mousedown.prevent="() => execCommand('undo')"
      title="Undo (Ctrl+Z)">
      <Undo class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('redo')"
      variant="ghost"
      size="sm"
      :disabled="!editorStore.canRedo"
      @mousedown.prevent="() => execCommand('redo')"
      title="Redo (Ctrl+Shift+Z)">
      <Redo class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { execCommand } from "@/utils/commands";
import { Redo, Undo } from "lucide-vue-next";

const editorStore = useEditorStore();
</script>
