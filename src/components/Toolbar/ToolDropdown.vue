<template>
  <div class="ck-dropdown" ref="dropdown">
    <button
      class="ck-dropdown__button ck-button"
      :class="{ 'ck-on': isOpen }"
      @mousedown.prevent="toggle"
      :title="title">
      <slot name="trigger" />
      <i class="fa fa-chevron-down" aria-hidden="true"></i>
      <NavArrowDownSolid />
    </button>

    <div class="ck-dropdown__panel" :class="panelClass" v-show="isOpen">
      <slot name="content" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NavArrowDownSolid } from "@iconoir/vue";
import { ref } from "vue";

const props = defineProps<{
  title?: string;
  panelClass?: string;
  isOpen?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
  open: [];
  close: [];
}>();

const dropdown = ref<HTMLElement>();

const toggle = () => {
  emit("toggle");
  if (props.isOpen) {
    emit("close");
  } else {
    emit("open");
  }
};
</script>

<style scoped>
.ck-dropdown {
  position: relative;
  display: inline-block;
}

.ck-dropdown__button {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  text-align: left;
  white-space: nowrap;
}

.ck-dropdown__panel {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 100%;
  background: hsl(0, 0%, 100%);
  border: 1px solid hsl(0, 0%, 87%);
  border-radius: 6px;
  box-shadow: 0 4px 6px hsla(0, 0%, 0%, 0.1);
  z-index: 9999;
  margin-top: 1px;
}
</style>
