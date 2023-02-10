import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Frontpage",
      meta: {
        title: "Cloudnet Data Portal",
      },
      component: () => import("../views/FrontpageView.vue"),
    },
    {
      path: "/privacy",
      name: "Privacy Policy",
      meta: {
        title: "Cloudnet privacy policy",
      },
      component: () => import("../views/PrivacyPolicyView.vue"),
    },
    {
      path: "/data-availability",
      name: "Data Availability",
      meta: {
        title: "Cloudnet Data Availability",
      },
      component: () => import("../views/DataAvailabilityView.vue"),
    },
    {
      path: "/search",
      redirect: "/search/data",
    },
    {
      path: "/file/:uuid",
      meta: {
        title: "Cloudnet Data Object",
      },
      component: () => import("../views/FileView.vue"),
      props: true,
      children: [
        {
          path: "",
          name: "File",
          component: () => import("../components/landing/LandingSummary.vue"),
        },
        {
          path: "visualizations",
          name: "FileVisualizations",
          component: () =>
            import("../components/landing/LandingVisualisations.vue"),
        },
        {
          path: "quality",
          name: "FileQualityReport",
          component: () =>
            import("../components/landing/LandingQualityReport.vue"),
        },
      ],
    },
    // Allow two slashes in URL. It's possible that some early PIDs resolve to a
    // landing pages with two slashes.
    {
      path: "/\\/file/:uuid",
      redirect: { name: "File" },
    },
    {
      path: "/search/:mode",
      name: "Search",
      meta: {
        title: "Cloudnet Search",
      },
      component: () => import("../views/SearchView.vue"),
      props: true,
    },
    {
      path: "/sites",
      name: "Sites",
      meta: {
        title: "Cloudnet Sites",
      },
      component: () => import("../views/SitesView.vue"),
      props: true,
    },
    {
      path: "/site/:siteid",
      name: "Site",
      meta: {
        title: "Cloudnet Site",
      },
      component: () => import("../views/SiteView.vue"),
      props: true,
    },
    {
      path: "/collection/:uuid/:mode?",
      name: "Collection",
      meta: {
        title: "Cloudnet Collection",
      },
      component: () => import("../views/CollectionView.vue"),
      props: (to) => ({
        ...to.params,
        mode: to.params.mode || "general",
      }),
    },
    {
      path: "/stats",
      name: "Download statistics",
      meta: {
        title: "Cloudnet Download statistics",
      },
      component: () => import("../views/StatsView.vue"),
      props: true,
    },
    {
      path: "/publications",
      name: "Cloudnet Publications",
      meta: {
        title: "Cloudnet Publications",
      },
      component: () => import("../views/PublicationsView.vue"),
      props: true,
    },
    {
      path: "/:pathMatch(.*)*",
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
  ],
});

router.beforeEach((to) => {
  document.title =
    typeof to.meta.title == "string" ? to.meta.title : "Cloudnet Data Portal";
});

export default router;
