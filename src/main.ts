import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";

// Export utilities
// export * from "./utils/commands";
// export * from "./utils/selection";
// export * from "./utils/sanitizer";
// export * from "./utils/tableOperations";

// // Export types
// export * from "./types";

createApp(App).use(createPinia()).mount("#app");
