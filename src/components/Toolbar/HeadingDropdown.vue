<template>
  <DropdownMenu v-model:open="toolbarStore.dropdowns.heading">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="min-w-[120px] justify-between"
        @mousedown.prevent="handleDropdownToggle">
        {{ toolbarStore.currentHeading }}
        <ChevronDown class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start" class="w-48">
      <DropdownMenuItem
        @mousedown.prevent="(e: any) => changeHeading('paragraph', e)">
        <span class="text-sm">Paragraph</span>
      </DropdownMenuItem>

      <DropdownMenuItem @mousedown.prevent="(e: any) => changeHeading('h1', e)">
        <span class="text-xl font-bold">Heading 1</span>
      </DropdownMenuItem>

      <DropdownMenuItem @mousedown.prevent="(e: any) => changeHeading('h2', e)">
        <span class="text-lg font-bold">Heading 2</span>
      </DropdownMenuItem>

      <DropdownMenuItem @mousedown.prevent="(e: any) => changeHeading('h3', e)">
        <span class="text-base font-bold">Heading 3</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditorStore } from "@/stores/editorStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { ChevronDown } from "lucide-vue-next";

const toolbarStore = useToolbarStore();
const editorStore = useEditorStore();

// FIXED: Prevent focus loss during dropdown operations
const handleDropdownToggle = (event: Event) => {
  event.preventDefault();
  editorStore.saveSelection();
  toolbarStore.toggleDropdown("heading");
};

const changeHeading = (level: string, event: Event) => {
  event.preventDefault();

  if (editorStore.isCodeView) return;

  editorStore.maintainFocus(() => {
    if (!editorStore.editorElement) return;

    try {
      if (level === "paragraph") {
        document.execCommand("formatBlock", false, "<div>");
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            let node = selection.anchorNode;
            if (node?.nodeType === Node.TEXT_NODE) {
              node = (node as Node).parentElement;
            }
            if ((node as Element)?.tagName === "DIV") {
              const p = document.createElement("p");
              p.innerHTML = (node as Element).innerHTML;
              (node as Element).parentNode?.replaceChild(p, node as Element);
            }
          }
          editorStore.updateToolbarState();
          toolbarStore.updateHeadingState();
        }, 10);
      } else {
        document.execCommand("formatBlock", false, `<${level}>`);
        setTimeout(() => {
          editorStore.updateToolbarState();
          toolbarStore.updateHeadingState();
        }, 10);
      }
    } catch (error) {
      console.warn("Heading command failed:", error);
    }
  });

  toolbarStore.closeAllDropdowns();
};
</script>
