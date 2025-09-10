<template>
  <div class="ck-toolbar__group">
    <!-- Text Color Tool -->
    <div class="ck-dropdown" v-if="tools.includes('foreColor')">
      <button
        class="ck-button ck-splitbutton__action"
        @mousedown.prevent="$emit('changeTextColor', currentTextColor)"
        title="Font Color">
        <i class="fa fa-font" aria-hidden="true"></i>
      </button>

      <button
        class="ck-button ck-splitbutton__arrow"
        @mousedown.prevent="store.toggleDropdown('color')"
        :class="{ 'ck-on': store.dropdowns.color }">
        <NavArrowDown />
      </button>
      <!-- TODO: fix drop down menu -->
      <div
        class="ck-dropdown__panel ck-color-picker"
        v-show="store.dropdowns.color">
        <div class="ck-color-grid">
          <button
            v-for="color in colorPalette"
            :key="color"
            class="ck-color-grid__tile"
            :style="{ backgroundColor: color }"
            @mousedown.prevent="changeTextColor(color)"
            :title="color"></button>
        </div>
      </div>
    </div>

    <!-- Highlight Tool -->
    <div class="ck-dropdown" v-if="tools.includes('highlight')">
      <button
        class="ck-button ck-splitbutton__action"
        @mousedown.prevent="$emit('applyHighlight', currentHighlightColor)"
        title="Highlight Text">
        <Highlighter />
      </button>
      <button
        class="ck-button ck-splitbutton__arrow"
        @mousedown.prevent="store.toggleDropdown('highlight')"
        :class="{ 'ck-on': store.dropdowns.highlight }">
        <NavArrowDown />
      </button>
      <!-- TODO: fix drop down menu -->
      <div
        class="ck-dropdown__panel ck-color-picker"
        v-show="store.dropdowns.highlight">
        <div class="ck-color-grid">
          <button
            v-for="color in highlightColorPalette"
            :key="color"
            class="ck-color-grid__tile"
            :class="{ 'highlight-remove': color === 'transparent' }"
            :style="{
              backgroundColor: color === 'transparent' ? '#fff' : color,
            }"
            @mousedown.prevent="applyHighlight(color)"
            :title="
              color === 'transparent'
                ? 'Remove Highlight'
                : `Highlight: ${color}`
            ">
            <i
              v-if="color === 'transparent'"
              class="fa fa-ban"
              style="color: #999; margin: auto"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NavArrowDown } from "@iconoir/vue";
import { Highlighter } from "lucide-vue-next";
import { useEditorStore } from "../../../stores/editorStore";
import type { ToolName } from "../../../types";

const props = defineProps<{
  tools: ToolName[];
  currentTextColor: string;
  currentHighlightColor: string;
}>();

const emit = defineEmits<{
  changeTextColor: [color: string];
  applyHighlight: [color: string];
}>();

const store = useEditorStore();

const colorPalette = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
];

const highlightColorPalette = [
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#ff00ff",
  "#ffaa00",
  "#ff6b6b",
  "#74c0fc",
  "#d0bfff",
  "#c3fae8",
  "#fff3bf",
  "transparent",
];

const changeTextColor = (color: string) => {
  emit("changeTextColor", color);
  store.closeAllDropdowns();
};

const applyHighlight = (color: string) => {
  emit("applyHighlight", color);
  store.closeAllDropdowns();
};
</script>

<style scoped>
.ck-splitbutton__action {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  border-right: 1px solid hsl(0, 0%, 87%) !important;
}

.ck-splitbutton__arrow {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  min-width: 24px !important;
  padding: 6px 4px !important;
}

.ck-dropdown {
  position: relative;
  display: inline-block;
}

.ck-color-picker {
  padding: 12px;
}

.ck-color-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}

.ck-color-grid__tile {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid hsl(0, 0%, 92%);
  cursor: pointer;
}

.ck-color-grid__tile.highlight-remove {
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.ck-color-grid__tile.highlight-remove::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 2px;
  background: #ff4444;
  transform: rotate(-45deg);
  top: 50%;
  left: 0;
}
</style>
