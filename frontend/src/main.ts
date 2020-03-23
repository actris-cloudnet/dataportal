import Vue from 'vue'
import App from './App.vue'
import Header from './components/Header.vue'
import ApiError from './views/ApiError.vue'
import router from './router'

Vue.config.productionTip = false

Vue.component('app-header', Header)
Vue.component('app-error', ApiError)

new Vue({
  router,
  render: h => h(App),
  watch: {
    '$route'(to, _from) {
      document.title = to.meta.title || 'Cloudnet Data Portal'
    }
  }
}).$mount('#app')
