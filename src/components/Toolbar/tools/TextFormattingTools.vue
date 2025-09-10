<template>
  <div class="ck-toolbar__group">
    <tool-button
      v-if="tools.includes('bold')"
      :isActive="activeStates.bold"
      title="Bold (Ctrl+B)"
      @execute="$emit('execCommand', 'bold')">
      <Bold />
    </tool-button>

    <tool-button
      v-if="tools.includes('italic')"
      :isActive="activeStates.italic"
      title="Italic (Ctrl+I)"
      @execute="$emit('execCommand', 'italic')">
      <Italic />
    </tool-button>

    <tool-button
      v-if="tools.includes('underline')"
      :isActive="activeStates.underline"
      title="Underline (Ctrl+U)"
      @execute="$emit('execCommand', 'underline')">
      <Underline />
    </tool-button>

    <tool-button
      v-if="tools.includes('strikeThrough')"
      :isActive="activeStates.strikeThrough"
      title="Strikethrough"
      @execute="$emit('execCommand', 'strikeThrough')">
      <i class="fa fa-strikethrough" aria-hidden="true"></i>
    </tool-button>
  </div>

  <div
    class="ck-toolbar__group"
    v-if="tools.includes('superscript') || tools.includes('subscript')">
    <tool-button
      v-if="tools.includes('superscript')"
      :isActive="activeStates.superscript"
      title="Superscript (Ctrl+Shift+=)"
      @execute="$emit('execCommand', 'superscript')">
      <i class="fa fa-superscript" aria-hidden="true"></i>
    </tool-button>

    <tool-button
      v-if="tools.includes('subscript')"
      :isActive="activeStates.subscript"
      title="Subscript (Ctrl+=)"
      @execute="$emit('execCommand', 'subscript')">
      <i class="fa fa-subscript" aria-hidden="true"></i>
    </tool-button>
  </div>
</template>

<script lang="ts" setup>
import { Bold, Italic, Underline } from "@iconoir/vue";
import type { ToolName } from "../../../types";
import ToolButton from "../ToolButton.vue";

defineProps<{
  tools: ToolName[];
  activeStates: Record<string, boolean>;
}>();

defineEmits<{
  execCommand: [command: string];
}>();
</script>
