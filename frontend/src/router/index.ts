import { hasPermission } from "@/lib/auth";
import type { PermissionType } from "@shared/entity/Permission";
import { watch, computed, ref, type Ref } from "vue";
import { createRouter, createWebHistory } from "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    title?: string | boolean;
    permission?: PermissionType;
  }
}

const routes = [
  {
    path: "/",
    name: "Frontpage",
    component: () => import("@/views/FrontpageView.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/LoginView.vue"),
  },
  {
    path: "/privacy",
    name: "PrivacyPolicy",
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
      title: "Sites",
    },
    component: () => import("@/views/SitesView.vue"),
    props: true,
  },
  {
    path: "/site/:siteId",
    meta: { title: false },
    component: () => import("@/views/SiteView.vue"),
    props: true,
    children: [
      {
        path: "",
        name: "Site",
        component: () => import("@/components/site/SiteOverview.vue"),
      },
      {
        path: "products",
        name: "SiteProducts",
        component: () => import("@/components/site/SiteProducts.vue"),
      },
    ],
  },
  {
    path: "/collection/:uuid",
    meta: {
      title: "Collection",
    },
    component: () => import("@/views/CollectionView.vue"),
    props: true,
    children: [
      {
        path: "",
        alias: "general", // Backward compatible with old layout.
        name: "Collection",
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
    name: "Statistics",
    meta: {
      title: "Statistics",
      permission: "canGetStats" satisfies PermissionType as PermissionType,
    },
    component: () => import("@/views/StatsView.vue"),
    props: true,
  },
  {
    path: "/contact",
    name: "Contact",
    meta: {
      title: "Contact",
    },
    component: () => import("@/views/ContactView.vue"),
    props: true,
  },
  {
    path: "/queue",
    name: "Queue",
    meta: {
      title: "Queue",
      permission: "canPublishTask" satisfies PermissionType as PermissionType,
    },
    component: () => import("@/views/QueueView.vue"),
    props: true,
  },
  {
    path: "/publications",
    name: "Publications",
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
  {
    path: "/instruments",
    name: "Instruments",
    meta: { title: "Instruments" },
    component: () => import("@/views/InstrumentsView.vue"),
    props: true,
  },
  {
    path: "/instrument/:uuid",
    meta: { title: false },
    component: () => import("@/views/InstrumentWrapper.vue"),
    props: true,
    children: [
      {
        path: "",
        name: "Instrument",
        meta: { title: false },
        component: () => import("@/components/instrument/InstrumentOverview.vue"),
      },
      {
        path: "raw-files",
        name: "RawFiles",
        meta: { title: false },
        component: () => import("@/components/instrument/RawFiles.vue"),
      },
      {
        path: "calibration",
        name: "InstrumentCalibration",
        meta: { title: false },
        component: () => import("@/components/instrument/InstrumentCalibration.vue"),
      },
    ],
  },
  {
    path: "/products",
    name: "Products",
    meta: { title: "Products" },
    component: () => import("@/views/ProductsView.vue"),
    props: true,
  },
  {
    path: "/product/:product",
    name: "Product",
    meta: { title: false },
    component: () => import("@/views/ProductView.vue"),
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const baseTitle = "Cloudnet data portal";

function setTitle(parts: string[]) {
  document.title = [...parts, baseTitle].join(" – ");
}

router.beforeEach((to, _from) => {
  if (to.meta.permission && !hasPermission(to.meta.permission).value) {
    return { name: "Login", query: { next: to.fullPath } };
  }

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

export { routes };

export default router;
