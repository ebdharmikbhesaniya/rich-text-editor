<template>
  <div class="flex items-center gap-1">
    <TableGridSelector v-if="editorStore.isToolEnabled('table')" />

    <Button
      v-if="editorStore.isToolEnabled('link')"
      variant="ghost"
      size="sm"
      @mousedown.prevent="insertLink"
      title="Insert Link (Ctrl+K)">
      <Link class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('horizontalRule')"
      variant="ghost"
      size="sm"
      @mousedown.prevent="() => execCommand('insertHorizontalRule')"
      title="Horizontal Rule">
      <Minus class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from "@/stores/editorStore";
import { execCommand, insertLink } from "@/utils/commands";
import { Button } from "@/components/ui/button";
import { Link, Minus } from "lucide-vue-next";
import TableGridSelector from "./TableGridSelector.vue";

const editorStore = useEditorStore();
</script>
