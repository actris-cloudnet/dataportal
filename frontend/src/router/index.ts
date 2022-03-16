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
    path: '/privacy',
    name: 'Privacy Policy',
    meta: {
      title: 'Cloudnet privacy policy'
    },
    component: () => import('../views/PrivacyPolicy.vue')
  },
  {
    path: '/data-availability',
    name: 'Data Availability',
    meta: {
      title: 'Cloudnet Data Availability'
    },
    component: () => import('../views/DataAvailability.vue'),
  },
  {
    path: '/search',
    redirect: '/search/data'
  },
  {
    path: '/(/)?file/:uuid',
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
    path: '/sites',
    name: 'Sites',
    meta: {
      title: 'Cloudnet Sites'
    },
    component: () => import('../views/Sites.vue'),
    props: true,
  },
  {
    path: '/site/:siteid',
    name: 'Site',
    meta: {
      title: 'Cloudnet Site'
    },
    component: () => import('../views/Site.vue'),
    props: true,
  },
  {
    path: '/collection/:uuid/:mode',
    name: 'Collection',
    meta: {
      title: 'Cloudnet Collection'
    },
    component: () => import('../views/Collection.vue'),
    props: true,
  },
  {
    path: '/collection/:uuid', redirect: '/collection/:uuid/general'
  },
  {
    path: '/quality/:uuid',
    name: 'Quality Report',
    meta: {
      title: 'Cloudnet Data Quality Report'
    },
    component: () => import('../views/QualityReport.vue'),
    props: true,
  },
  {
    path: '/stats',
    name: 'Download statistics',
    meta: {
      title: 'Cloudnet Download statistics'
    },
    component: () => import('../views/Stats.vue'),
    props: true,
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
