<template>
  <div class="flex items-center gap-1">
    <Button
      v-if="editorStore.isToolEnabled('bold')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('bold') }"
      @mousedown="(e: any) => handleFormatClick(e, 'bold')"
      title="Bold (Ctrl+B)">
      <Bold class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('italic')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('italic') }"
      @mousedown="(e: any) => handleFormatClick(e, 'italic')"
      title="Italic (Ctrl+I)">
      <Italic class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('underline')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('underline') }"
      @mousedown="(e: any) => handleFormatClick(e, 'underline')"
      title="Underline (Ctrl+U)">
      <Underline class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('strikethrough')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('strikeThrough') }"
      @mousedown="(e: any) => handleFormatClick(e, 'strikeThrough')"
      title="Strikethrough">
      <Strikethrough class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('superscript')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('superscript') }"
      @mousedown="(e: any) => handleFormatClick(e, 'superscript')"
      title="Superscript">
      <Superscript class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('subscript')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('subscript') }"
      @mousedown="(e: any) => handleFormatClick(e, 'subscript')"
      title="Subscript">
      <Subscript class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { isActive } from "@/utils/commands";
import {
  Bold,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from "lucide-vue-next";

const editorStore = useEditorStore();

// FIXED: Proper command execution without losing focus
const handleFormatClick = (event: MouseEvent, command: string) => {
  event.preventDefault();

  // Save selection immediately
  editorStore.saveSelection();

  // Execute command with focus management
  editorStore.maintainFocus(() => {
    editorStore.executeCommand(command);
  });
};
</script>
