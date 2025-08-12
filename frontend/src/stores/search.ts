import { ref, computed } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { backendUrl, dateToString } from "@/lib";

import { useRouteQuery, queryString, queryStringArray } from "@/lib/useRouteQuery";

import type { SearchFile } from "@shared/entity/SearchFile";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";

export const useSearchStore = defineStore("search", () => {
  // --- STATE ---
  const results = ref<SearchFile[]>([]);
  const pagination = ref<SearchFileResponse["pagination"] | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const today = dateToString(new Date());

  // --- FILTERS ---
  const sites = useRouteQuery({ name: "site", defaultValue: [], type: queryStringArray });
  const dateFrom = useRouteQuery({ name: "dateFrom", defaultValue: today, type: queryString });
  const dateTo = useRouteQuery({ name: "dateTo", defaultValue: today, type: queryString });
  const products = useRouteQuery({ name: "product", defaultValue: [], type: queryStringArray });
  const instruments = useRouteQuery({ name: "instrument", defaultValue: [], type: queryStringArray });
  const instrumentPids = useRouteQuery({ name: "instrumentPid", defaultValue: [], type: queryStringArray });
  const currentPage = useRouteQuery({
    name: "page",
    defaultValue: 1,
    type: { parse: (x) => parseInt(x, 10), format: (x) => x.toString() },
  });

  // --- GETTERS ---
  const searchFilters = computed(() => ({
    sites: sites.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    products: products.value,
    instruments: instruments.value,
    instrumentPids: instrumentPids.value,
  }));

  // --- ACTIONS ---
  let requestController: AbortController | null = null;

  async function performSearch() {
    if (requestController) {
      requestController.abort();
    }
    requestController = new AbortController();

    isLoading.value = true;
    error.value = null;

    try {
      const payload = {
        ...searchFilters.value,
        showLegacy: true,
        privateFrontendOrder: true,
        page: currentPage.value,
      };
      const res = await axios.get<SearchFileResponse>(`${backendUrl}search`, {
        params: payload,
        signal: requestController.signal,
      });
      results.value = res.data.results;
      pagination.value = res.data.pagination;
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error(err);
      error.value = (axios.isAxiosError(err) && err.response?.statusText) || "unknown error";
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    results,
    pagination,
    isLoading,
    error,
    // Filters
    sites,
    dateFrom,
    dateTo,
    products,
    instruments,
    instrumentPids,
    currentPage,
    // Getters
    searchFilters,
    // Actions
    performSearch,
  };
});
