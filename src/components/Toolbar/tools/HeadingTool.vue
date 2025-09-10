<template>
  <div class="ck-toolbar__group">
    <tool-dropdown
      :title="'Paragraph / Heading'"
      :isOpen="store.dropdowns.heading"
      @toggle="store.toggleDropdown('heading')">
      <template #trigger>
        {{ store.currentHeading }}
      </template>

      <template #content>
        <ul class="ck-list">
          <li
            class="ck-list__item"
            v-for="option in headingOptions"
            :key="option.tag">
            <button
              class="ck-button ck-list__button"
              @mousedown.prevent="changeHeading(option.tag)">
              <span class="ck-list__label" :class="option.className">
                {{ option.label }}
              </span>
            </button>
          </li>
        </ul>
      </template>
    </tool-dropdown>
  </div>
</template>

<script lang="ts" setup>
import { useEditorStore } from "../../../stores/editorStore";
import ToolDropdown from "../ToolDropdown.vue";

const store = useEditorStore();

const emit = defineEmits<{
  changeHeading: [level: string];
}>();

const headingOptions = [
  { label: "Paragraph", tag: "paragraph", className: "" },
  { label: "Heading 1", tag: "h1", className: "ck-heading_heading1" },
  { label: "Heading 2", tag: "h2", className: "ck-heading_heading2" },
  { label: "Heading 3", tag: "h3", className: "ck-heading_heading3" },
];

const changeHeading = (level: string) => {
  emit("changeHeading", level);
  store.closeAllDropdowns();
};
</script>

<style scoped>
.ck-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
}

.ck-list__item {
  margin: 0;
}

.ck-list__button {
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
}

.ck-list__button:hover {
  background: hsl(0, 0%, 96%);
}

.ck-list__label {
  display: block;
}

.ck-heading_heading1 {
  font-size: 20px;
  font-weight: bold;
}

.ck-heading_heading2 {
  font-size: 17px;
  font-weight: bold;
}

.ck-heading_heading3 {
  font-size: 14px;
  font-weight: bold;
}
</style>
