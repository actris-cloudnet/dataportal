import Vue from "vue";
import App from "./App.vue";
import router from "./router";

Vue.config.productionTip = false;

new Vue({
  router,
  render: (h) => h(App),
  watch: {
    $route(to, _from) {
      document.title = to.meta.title || "Cloudnet Data Portal";
    },
  },
}).$mount("#app");
