import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Frontpage',
    meta: {
      title: 'Cloudnet Data Portal'
    },
    component: () => import('../views/Frontpage.vue')
  },
  {
    path: '/search',
    redirect: '/search/data'
  },
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
    path: '/search/:mode',
    name: 'Search',
    meta: {
      title: 'Cloudnet Search'
    },
    component: () => import('../views/Search.vue'),
    props: true
  },
  {
    path: '*',
    name: 'ApiError',
    meta: {
      title: 'Not Found'
    },
    component: () => import('../views/ApiError.vue'),
    props: {
      response: {
        status: 404,
        data: 'Not Found'
      }
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
