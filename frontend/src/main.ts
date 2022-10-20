import Vue from "vue";
import App from "./App.vue";
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
import ApiError from "./views/ApiError.vue";
import router from "./router";
import Component from "vue-class-component";

Vue.config.productionTip = false;

Vue.component("app-header", Header);
Vue.component("app-footer", Footer);
Vue.component("app-error", ApiError);

Component.registerHooks(["metaInfo"]);

new Vue({
  router,
  render: (h) => h(App),
  watch: {
    $route(to, _from) {
      document.title = to.meta.title || "Cloudnet Data Portal";
    },
  },
}).$mount("#app");
