<template>
  <div class="flex items-center gap-1">
    <Button
      v-if="editorStore.isToolEnabled('bulletList')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('insertUnorderedList') }"
      @mousedown.prevent="() => execCommand('insertUnorderedList')"
      title="Bulleted List">
      <List class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('numberedList')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('insertOrderedList') }"
      @mousedown.prevent="() => execCommand('insertOrderedList')"
      title="Numbered List">
      <ListOrdered class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from "@/stores/editorStore";
import { execCommand, isActive } from "@/utils/commands";
import { Button } from "@/components/ui/button";
import { List, ListOrdered } from "lucide-vue-next";

const editorStore = useEditorStore();
</script>
