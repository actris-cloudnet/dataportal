import { watch, computed, ref, type Ref } from "vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Frontpage",
      component: () => import("@/views/FrontpageView.vue"),
    },
    {
      path: "/privacy",
      name: "Privacy Policy",
      meta: {
        title: "Privacy policy",
      },
      component: () => import("@/views/PrivacyPolicyView.vue"),
    },
    {
      path: "/search",
      redirect: "/search/data",
    },
    {
      path: "/file/:uuid",
      component: () => import("@/views/FileView.vue"),
      props: true,
      meta: { title: false },
      children: [
        {
          path: "",
          name: "File",
          meta: { title: false },
          component: () => import("@/components/landing/LandingSummary.vue"),
        },
        {
          path: "visualizations",
          name: "FileVisualizations",
          meta: { title: false },
          component: () => import("@/components/landing/LandingVisualizations.vue"),
        },
        {
          path: "quality",
          name: "FileQualityReport",
          meta: { title: false },
          component: () => import("@/components/landing/LandingQualityReport.vue"),
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
        title: "Search",
      },
      component: () => import("@/views/SearchView.vue"),
      props: true,
    },
    {
      path: "/sites",
      name: "Sites",
      meta: {
        title: "Measurement sites",
      },
      component: () => import("@/views/SitesView.vue"),
      props: true,
    },
    {
      path: "/site/:siteid",
      name: "Site",
      meta: { title: false },
      component: () => import("@/views/SiteView.vue"),
      props: true,
    },
    {
      path: "/collection/:uuid",
      name: "Collection",
      meta: {
        title: "Collection",
      },
      component: () => import("@/views/CollectionView.vue"),
      props: true,
      children: [
        {
          path: "",
          alias: "general", // Backward compatible with old layout.
          name: "CollectionSummary",
          meta: { title: false },
          component: () => import("@/components/collection/CollectionSummary.vue"),
        },
        {
          path: "files",
          name: "CollectionFiles",
          meta: { title: false },
          component: () => import("@/components/collection/CollectionFiles.vue"),
        },
      ],
    },
    {
      path: "/stats",
      name: "Download statistics",
      meta: {
        title: "Download statistics",
      },
      component: () => import("@/views/StatsView.vue"),
      props: true,
    },
    {
      path: "/publications",
      name: "Cloudnet Publications",
      meta: {
        title: "Publications",
      },
      component: () => import("@/views/PublicationsView.vue"),
      props: true,
    },
    {
      path: "/:pathMatch(.*)*",
      name: "ApiError",
      meta: {
        title: "Not Found",
      },
      component: () => import("@/views/ApiError.vue"),
      props: {
        response: {
          status: 404,
          data: "Not Found",
        },
      },
    },
  ],
});

const baseTitle = "Cloudnet data portal";

function setTitle(parts: string[]) {
  document.title = [...parts, baseTitle].join(" – ");
}

router.beforeEach((to) => {
  if (typeof to.meta.title === "string") {
    setTitle([to.meta.title]);
  } else if (typeof to.meta.title === "undefined") {
    setTitle([]);
  }
});

type TitleParts = (string | undefined)[];

export function useTitle(parts: TitleParts | Ref<TitleParts>) {
  watch(
    typeof parts === "function" ? computed<TitleParts>(parts) : ref(parts),
    (parts) => setTitle(parts.filter((x): x is string => !!x)),
    { immediate: true },
  );
}

export default router;
