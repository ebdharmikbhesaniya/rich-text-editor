<template>
  <Button
    variant="ghost"
    size="sm"
    :class="{ 'bg-blue-100': editorStore.isCodeView }"
    @mousedown.prevent="editorStore.toggleCodeView"
    title="Source Code View">
    <Code class="h-4 w-4" />
  </Button>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { Code } from "lucide-vue-next";

const editorStore = useEditorStore();
</script>
