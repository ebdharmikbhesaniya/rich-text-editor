<template>
  <div class="flex items-center gap-1">
    <Button
      v-if="editorStore.isToolEnabled('bold')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('bold') }"
      @mousedown.prevent="execCommand('bold')"
      title="Bold (Ctrl+B)">
      <Bold class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('italic')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('italic') }"
      @mousedown.prevent="execCommand('italic')"
      title="Italic (Ctrl+I)">
      <Italic class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('underline')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('underline') }"
      @mousedown.prevent="execCommand('underline')"
      title="Underline (Ctrl+U)">
      <Underline class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('strikethrough')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('strikeThrough') }"
      @mousedown.prevent="execCommand('strikeThrough')"
      title="Strikethrough">
      <Strikethrough class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('superscript')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('superscript') }"
      @mousedown.prevent="execCommand('superscript')"
      title="Superscript">
      <Superscript class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('subscript')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('subscript') }"
      @mousedown.prevent="execCommand('subscript')"
      title="Subscript">
      <Subscript class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from "@/stores/editorStore";
import { execCommand, isActive } from "@/utils/commands";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Superscript,
  Subscript,
} from "lucide-vue-next";

const editorStore = useEditorStore();
</script>
