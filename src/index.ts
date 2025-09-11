import type { App } from "vue";
import RichTextEditor from "./components/Editor/RichTextEditor.vue";
import * as stores from "./stores";

export { RichTextEditor };
export * from "./types";
export { stores };

export default {
  install(app: App) {
    app.component("RichTextEditor", RichTextEditor);
  },
};
