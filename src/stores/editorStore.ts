import { defineStore } from "pinia";
import { ref } from "vue";

export const useEditorStore = defineStore("editor", () => {
  const content = ref("");

  return {
    // State
    content,
  };
});
