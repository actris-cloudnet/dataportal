import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import ViteYaml from "@modyfi/vite-plugin-yaml";

export default defineConfig({
  plugins: [vue(), ViteYaml()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../shared/lib", import.meta.url)),
    },
  },
  define: {
    "import.meta.env.DATAPORTAL_VERSION": JSON.stringify(process.env.npm_package_version),
    "import.meta.env.FAVICON_URL": JSON.stringify(
      process.env.NODE_ENV === "production" ? "/cloudnet.png" : "/cloudnet-dev.png",
    ),
  },
  server: {
    proxy: {
      "/api": "http://dataportal-backend:3000",
    },
  },
  test: {
    environment: "jsdom",
    execArgv: ["--no-webstorage"],
  },
});
