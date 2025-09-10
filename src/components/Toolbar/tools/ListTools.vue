<template>
  <div class="ck-toolbar__group">
    <tool-button
      v-if="tools.includes('insertUnorderedList')"
      :isActive="activeStates.insertUnorderedList"
      title="Bulleted List"
      @execute="$emit('execCommand', 'insertUnorderedList')">
      <List />
    </tool-button>

    <tool-button
      v-if="tools.includes('insertOrderedList')"
      :isActive="activeStates.insertOrderedList"
      title="Numbered List"
      @execute="$emit('execCommand', 'insertOrderedList')">
      <NumberedListLeft />
    </tool-button>
  </div>
</template>

<script lang="ts" setup>
import { List, NumberedListLeft } from "@iconoir/vue";
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
