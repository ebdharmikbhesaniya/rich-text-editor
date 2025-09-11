import type { App } from "vue";
import RichTextEditor from "./components/Editor/RichTextEditor.vue";
import * as stores from "./stores";

export * from "./types";
export { RichTextEditor, stores };

export default {
  install(app: App) {
    app.component("RichTextEditor", RichTextEditor);
  },
};
