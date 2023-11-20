import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "import.meta.env.DATAPORTAL_VERSION": JSON.stringify(process.env.npm_package_version),
    "import.meta.env.FAVICON_URL": JSON.stringify(
      process.env.NODE_ENV === "production" ? "/cloudnet.png" : "/cloudnet-dev.png",
    ),
  },
});
