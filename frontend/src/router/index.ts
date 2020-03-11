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
    meta: {
      title: 'Cloudnet Data Object'
    },
    component: () => import('../views/File.vue'),
    props: true,
  },
  {
    path: '/search',
    name: 'Search',
    meta: {
      title: 'Cloudnet Search'
    },
    component: () => import('../views/Search.vue'),
    props: true
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
