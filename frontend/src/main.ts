import { createApp } from "vue";
import VueMatomo from "vue-matomo";

import App from "./App.vue";
import router from "./router";
import { initLogin } from "./lib/auth";

initLogin()
  .then(() => {
    const app = createApp(App);

    app.use(router);

    if (import.meta.env.VITE_MATOMO_HOST && import.meta.env.VITE_MATOMO_SITE_ID) {
      app.use(VueMatomo, {
        host: import.meta.env.VITE_MATOMO_HOST,
        siteId: import.meta.env.VITE_MATOMO_SITE_ID,
        router,
        disableCookies: true,
      });
    }

    app.mount("#app");
  })
  .catch((err) => {
    alert(`Login failed: ${err}`);
  });
