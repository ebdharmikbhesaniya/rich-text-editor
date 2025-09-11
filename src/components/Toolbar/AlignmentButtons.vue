<template>
  <div class="flex items-center gap-1">
    <Button
      v-if="editorStore.isToolEnabled('alignLeft')"
      variant="ghost"
      size="sm"
      @mousedown.prevent="() => execCommand('justifyLeft')"
      title="Align Left">
      <AlignLeft class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('alignCenter')"
      variant="ghost"
      size="sm"
      @mousedown.prevent="() => execCommand('justifyCenter')"
      title="Align Center">
      <AlignCenter class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('alignRight')"
      variant="ghost"
      size="sm"
      @mousedown.prevent="() => execCommand('justifyRight')"
      title="Align Right">
      <AlignRight class="h-4 w-4" />
    </Button>

    <Button
      v-if="editorStore.isToolEnabled('alignJustify')"
      variant="ghost"
      size="sm"
      :class="{ 'bg-blue-100': isActive('justifyFull') }"
      @mousedown.prevent="() => execCommand('justifyFull')"
      title="Justify">
      <AlignJustify class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { execCommand, isActive } from "@/utils/commands";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
} from "lucide-vue-next";

const editorStore = useEditorStore();
</script>
