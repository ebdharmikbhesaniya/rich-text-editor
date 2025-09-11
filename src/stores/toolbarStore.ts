import { defineStore } from "pinia";
import { ref, nextTick } from "vue";

export const useToolbarStore = defineStore("toolbar", () => {
  // State
  const currentHeading = ref("Paragraph");
  const currentTextColor = ref("#000000");
  const currentHighlightColor = ref("#ffff00");
  const dropdowns = ref<Record<string, boolean>>({
    heading: false,
    color: false,
    highlight: false,
    tableHeaderColor: false,
    tableGrid: false,
  });

  const colorPalette = ref([
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
  ]);

  const highlightColorPalette = ref([
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
  ]);

  // Actions
  const toggleDropdown = (name: string) => {
    for (const key of Object.keys(dropdowns.value)) {
      dropdowns.value[key] = false;
    }
    dropdowns.value[name] = !dropdowns.value[name];
  };

  const closeAllDropdowns = () => {
    for (const key of Object.keys(dropdowns.value)) {
      dropdowns.value[key] = false;
    }
  };

  const updateHeadingState = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      currentHeading.value = "Paragraph";
      return;
    }

    let node = sel.anchorNode;
    if (!node) {
      currentHeading.value = "Paragraph";
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    while (node) {
      const tag = (node as Element).tagName?.toLowerCase();
      if (tag?.startsWith("h") && tag.length === 2 && /\d/.test(tag[1])) {
        currentHeading.value = `Heading ${tag[1]}`;
        return;
      }
      node = (node as Element).parentElement;
    }

    currentHeading.value = "Paragraph";
  };

  return {
    // State
    currentHeading,
    currentTextColor,
    currentHighlightColor,
    dropdowns,
    colorPalette,
    highlightColorPalette,

    // Actions
    toggleDropdown,
    closeAllDropdowns,
    updateHeadingState,
  };
});
