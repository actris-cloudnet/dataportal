import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { backendUrl, dateToString, compareValues } from "@/lib";
import { useRouteQuery, queryString, queryStringArray, queryBoolean } from "@/lib/useRouteQuery";

import type { Site } from "@shared/entity/Site";
import type { Instrument, InstrumentInfo } from "@shared/entity/Instrument";
import type { SearchFile } from "@shared/entity/SearchFile";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";
import type { Option } from "@/components/MultiSelect.vue";
import type { Product } from "@shared/entity/Product";

type InstrumentPidOption = Option & { type: string };

export const useSearchStore = defineStore("search", () => {
  // --- STATE ---
  const results = ref<SearchFile[]>([]);
  const pagination = ref<SearchFileResponse["pagination"] | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const today = dateToString(new Date());

  // All available sites for the filter
  const allSites = ref<Site[]>([]);
  const sitesError = ref<string | null>(null);

  // All available instruments for the filter
  const allInstruments = ref<Instrument[]>([]);
  const allInstrumentPids = ref<InstrumentPidOption[]>([]);
  const instrumentsError = ref<string | null>(null);

  const allProducts = ref<Product[]>([]);
  const productsError = ref<string | null>(null);

  // --- FILTERS ---
  const sites = useRouteQuery({ name: "site", defaultValue: [], type: queryStringArray });
  const dateFrom = useRouteQuery({ name: "dateFrom", defaultValue: today, type: queryString });
  const dateTo = useRouteQuery({ name: "dateTo", defaultValue: today, type: queryString });
  const products = useRouteQuery({ name: "product", defaultValue: [], type: queryStringArray });
  const showExpProducts = useRouteQuery({ name: "experimental", defaultValue: false, type: queryBoolean });
  const instruments = useRouteQuery({ name: "instrument", defaultValue: [], type: queryStringArray });
  const instrumentPids = useRouteQuery({ name: "instrumentPid", defaultValue: [], type: queryStringArray });
  const currentPage = useRouteQuery({
    name: "page",
    defaultValue: 1,
    type: { parse: (x) => parseInt(x, 10), format: (x) => x.toString() },
  });

  // --- GETTERS ---
  const productOptions = computed(() =>
    allProducts.value.filter((product) => showExpProducts.value || !product.experimental),
  );

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

  const alphabeticalSort = (a: Option, b: Option) => compareValues(a.humanReadableName, b.humanReadableName);
  const instrumentSort = (a: Instrument, b: Instrument) =>
    a.type == b.type
      ? compareValues(a.shortName || a.humanReadableName, b.shortName || b.humanReadableName)
      : compareValues(a.type, b.type);

  async function fetchSites() {
    sitesError.value = null;
    try {
      const res = await axios.get<Site[]>(`${backendUrl}sites/`, {
        params: { type: ["cloudnet", "campaign", "arm"] },
      });
      allSites.value = res.data.filter((site) => !site.type.includes("hidden"));
    } catch (err) {
      console.error(err);
      sitesError.value = "Failed to fetch sites";
    }
  }

  async function fetchProducts() {
    productsError.value = null;
    try {
      const res = await axios.get<Product[]>(`${backendUrl}products/variables`);
      allProducts.value = res.data.sort(alphabeticalSort);
    } catch (err) {
      console.error(err);
      productsError.value = "Failed to fetch products";
    }
  }

  async function fetchInstruments() {
    instrumentsError.value = null;
    try {
      const [instrumentsRes, pidsRes] = await Promise.all([
        axios.get<Instrument[]>(`${backendUrl}instruments`),
        axios.get<InstrumentInfo[]>(`${backendUrl}instrument-pids`),
      ]);

      allInstruments.value = instrumentsRes.data.sort(instrumentSort);
      allInstrumentPids.value = pidsRes.data
        .map((obj) => ({ id: obj.pid, humanReadableName: obj.name, type: obj.instrument.type }))
        .sort(alphabeticalSort);
    } catch (err) {
      console.error(err);
      instrumentsError.value = "Failed to fetch instrument data";
    }
  }

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

  watch(
    [products, allProducts],
    ([selectedIds, all]) => {
      if (showExpProducts.value || all.length === 0) return;
      if (selectedIds.some((id) => all.find((p) => p.id === id)?.experimental)) {
        showExpProducts.value = true;
      }
    },
    { deep: true },
  );

  return {
    // State
    results,
    pagination,
    isLoading,
    error,
    allSites,
    sitesError,
    allInstruments,
    allInstrumentPids,
    instrumentsError,
    allProducts,
    productsError,
    // Filters
    sites,
    dateFrom,
    dateTo,
    products,
    showExpProducts,
    instruments,
    instrumentPids,
    currentPage,
    // Getters
    searchFilters,
    productOptions,
    // Actions
    performSearch,
    fetchSites,
    fetchInstruments,
    fetchProducts,
  };
});
