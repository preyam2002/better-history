import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Better History",
  version: "0.1.1",
  description:
    "Better search, session grouping, and analytics for your browsing history.",
  permissions: ["history", "tabs", "idle", "storage", "alarms"],
  chrome_url_overrides: {
    newtab: "src/newtab/index.html",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["https://*/*", "http://*/*"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
});
