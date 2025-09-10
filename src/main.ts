import { createApp } from "vue";
import "./index.css";
import App from "./App.vue";
import { createPinia } from "pinia";

// Export utilities
// export * from "./utils/commands";
// export * from "./utils/selection";
// export * from "./utils/sanitizer";
// export * from "./utils/tableOperations";

// // Export types
// export * from "./types";

createApp(App).use(createPinia()).mount("#app");
