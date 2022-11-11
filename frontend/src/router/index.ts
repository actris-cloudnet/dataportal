import Vue from "vue";
import VueRouter from "vue-router";
import VueMeta from "vue-meta";

Vue.use(VueRouter);
Vue.use(VueMeta);

const routes = [
  {
    path: "/",
    name: "Frontpage",
    meta: {
      title: "Cloudnet Data Portal",
    },
    component: () => import("../views/Frontpage.vue"),
  },
  {
    path: "/privacy",
    name: "Privacy Policy",
    meta: {
      title: "Cloudnet privacy policy",
    },
    component: () => import("../views/PrivacyPolicy.vue"),
  },
  {
    path: "/data-availability",
    name: "Data Availability",
    meta: {
      title: "Cloudnet Data Availability",
    },
    component: () => import("../views/DataAvailability.vue"),
  },
  {
    path: "/search",
    redirect: "/search/data",
  },
  {
    // Allow two slashes in URL. Investigate if this is really needed.
    path: "/(/)?file/:uuid",
    meta: {
      title: "Cloudnet Data Object",
    },
    component: () => import("../views/File.vue"),
    props: true,
    children: [
      { path: "", name: "File", component: () => import("../components/landing/LandingSummary.vue") },
      {
        path: "visualizations",
        name: "FileVisualizations",
        component: () => import("../components/landing/LandingVisualisations.vue"),
      },
      {
        path: "quality",
        name: "FileQualityReport",
        component: () => import("../components/landing/LandingQualityReport.vue"),
      },
    ],
  },
  {
    path: "/search/:mode",
    name: "Search",
    meta: {
      title: "Cloudnet Search",
    },
    component: () => import("../views/Search.vue"),
    props: true,
  },
  {
    path: "/sites",
    name: "Sites",
    meta: {
      title: "Cloudnet Sites",
    },
    component: () => import("../views/Sites.vue"),
    props: true,
  },
  {
    path: "/site/:siteid",
    name: "Site",
    meta: {
      title: "Cloudnet Site",
    },
    component: () => import("../views/Site.vue"),
    props: true,
  },
  {
    path: "/collection/:uuid/:mode",
    name: "Collection",
    meta: {
      title: "Cloudnet Collection",
    },
    component: () => import("../views/Collection.vue"),
    props: true,
  },
  {
    path: "/collection/:uuid",
    redirect: "/collection/:uuid/general",
  },
  {
    path: "/quality/:uuid",
    name: "Quality Report",
    meta: {
      title: "Cloudnet Data Quality Report",
    },
    component: () => import("../views/QualityReport.vue"),
    props: true,
  },
  {
    path: "/stats",
    name: "Download statistics",
    meta: {
      title: "Cloudnet Download statistics",
    },
    component: () => import("../views/Stats.vue"),
    props: true,
  },
  {
    path: "/publications",
    name: "Cloudnet Publications",
    meta: {
      title: "Cloudnet Publications",
    },
    component: () => import("../views/Publications.vue"),
    props: true,
  },
  {
    path: "*",
    name: "ApiError",
    meta: {
      title: "Not Found",
    },
    component: () => import("../views/ApiError.vue"),
    props: {
      response: {
        status: 404,
        data: "Not Found",
      },
    },
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
