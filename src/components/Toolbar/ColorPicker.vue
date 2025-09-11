<template>
  <div class="flex items-center">
    <Button
      variant="ghost"
      size="sm"
      class="border-r-0 rounded-r-none"
      @mousedown.prevent="handleColorApply"
      title="Font Color">
      <Type class="h-4 w-4" />
    </Button>

    <DropdownMenu v-model:open="toolbarStore.dropdowns.color">
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="border-l-0 rounded-l-none px-2"
          @mousedown.prevent="handleDropdownToggle">
          <ChevronDown class="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent class="p-3">
        <div class="grid grid-cols-10 gap-1">
          <button
            v-for="color in toolbarStore.colorPalette"
            :key="color"
            class="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
            :style="{ backgroundColor: color }"
            @mousedown.prevent="(e) => changeTextColor(color, e)"
            :title="color" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditorStore } from "@/stores/editorStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { execCommand } from "@/utils/commands";
import { ChevronDown, Type } from "lucide-vue-next";

const toolbarStore = useToolbarStore();
const editorStore = useEditorStore();

// FIXED: Maintain focus during color operations
const handleColorApply = (event: Event) => {
  event.preventDefault();
  editorStore.maintainFocus(() => {
    execCommand("foreColor", toolbarStore.currentTextColor);
  });
};

const handleDropdownToggle = (event: Event) => {
  event.preventDefault();
  // Save selection before opening dropdown
  editorStore.saveSelection();
  toolbarStore.toggleDropdown("color");
};

const changeTextColor = (color: string, event: Event) => {
  event.preventDefault();
  toolbarStore.currentTextColor = color;

  editorStore.maintainFocus(() => {
    execCommand("foreColor", color);
  });

  toolbarStore.closeAllDropdowns();
};
</script>
