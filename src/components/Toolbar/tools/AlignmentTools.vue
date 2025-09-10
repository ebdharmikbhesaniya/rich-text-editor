<template>
  <div class="ck-toolbar__group">
    <tool-button
      v-if="tools.includes('justifyLeft')"
      title="Align Left"
      @execute="$emit('execCommand', 'justifyLeft')">
      <AlignLeft />
    </tool-button>

    <tool-button
      v-if="tools.includes('justifyCenter')"
      title="Align Center"
      @execute="$emit('execCommand', 'justifyCenter')">
      <i class="fa fa-align-center" aria-hidden="true"></i>
      <AlignCenter />
    </tool-button>

    <tool-button
      v-if="tools.includes('justifyRight')"
      title="Align Right"
      @execute="$emit('execCommand', 'justifyRight')">
      <AlignRight />
    </tool-button>

    <tool-button
      v-if="tools.includes('justifyFull')"
      :isActive="activeStates.justifyFull"
      title="Justify"
      @execute="$emit('execCommand', 'justifyFull')">
      <i class="fa fa-align-justify" aria-hidden="true"></i>
      <AlignJustify />
    </tool-button>
  </div>
</template>

<script lang="ts" setup>
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "@iconoir/vue";
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
