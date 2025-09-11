<template>
  <div class="flex items-center">
    <Button
      variant="ghost"
      size="sm"
      class="border-r-0 rounded-r-none"
      @mousedown.prevent="applyHighlight(toolbarStore.currentHighlightColor)"
      title="Highlight Text">
      <Highlighter class="h-4 w-4" />
    </Button>

    <DropdownMenu v-model:open="toolbarStore.dropdowns.highlight">
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="border-l-0 rounded-l-none px-2">
          <ChevronDown class="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent class="p-3">
        <div class="grid grid-cols-6 gap-1">
          <button
            v-for="color in toolbarStore.highlightColorPalette"
            :key="color"
            class="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform relative"
            :class="{
              'flex items-center justify-center': color === 'transparent',
            }"
            :style="{
              backgroundColor: color === 'transparent' ? '#fff' : color,
            }"
            @mousedown.prevent="applyHighlight(color)"
            :title="
              color === 'transparent'
                ? 'Remove Highlight'
                : `Highlight: ${color}`
            ">
            <X v-if="color === 'transparent'" class="h-3 w-3 text-gray-500" />
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { useToolbarStore } from "@/stores/toolbarStore";
import { execCommand } from "@/utils/commands";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Highlighter, ChevronDown, X } from "lucide-vue-next";

const toolbarStore = useToolbarStore();

const applyHighlight = (color: string) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  if (color === "transparent") {
    execCommand("hiliteColor", "transparent");
    execCommand("backColor", "transparent");
  } else {
    execCommand("hiliteColor", color);
    if (!document.queryCommandSupported("hiliteColor")) {
      execCommand("backColor", color);
    }
  }

  toolbarStore.currentHighlightColor = color;
  toolbarStore.closeAllDropdowns();
};
</script>
