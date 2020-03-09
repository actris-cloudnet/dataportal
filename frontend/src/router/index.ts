import Vue from 'vue'
import VueRouter from 'vue-router'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(VueRouter)

const routes = [
  {
    path: '/file/:uuid',
    name: 'File',
    component: () => import('../views/File.vue'),
    props: true
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/Search.vue'),
    props: true
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
