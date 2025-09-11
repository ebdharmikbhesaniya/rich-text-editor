<template>
  <DropdownMenu v-model:open="toolbarStore.dropdowns.heading">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="sm" class="min-w-[120px] justify-between">
        {{ toolbarStore.currentHeading }}
        <ChevronDown class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start" class="w-48">
      <DropdownMenuItem @click="changeHeading('paragraph')">
        <span class="text-sm">Paragraph</span>
      </DropdownMenuItem>

      <DropdownMenuItem @click="changeHeading('h1')">
        <span class="text-xl font-bold">Heading 1</span>
      </DropdownMenuItem>

      <DropdownMenuItem @click="changeHeading('h2')">
        <span class="text-lg font-bold">Heading 2</span>
      </DropdownMenuItem>

      <DropdownMenuItem @click="changeHeading('h3')">
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
import { useToolbarStore } from "@/stores/toolbarStore";
import { execCommand } from "@/utils/commands";
import { ChevronDown } from "lucide-vue-next";

const toolbarStore = useToolbarStore();

const changeHeading = (level: string) => {
  if (level === "paragraph") {
    execCommand("formatBlock", "<p>");
  } else {
    execCommand("formatBlock", `<${level}>`);
  }
  toolbarStore.closeAllDropdowns();
};
</script>
