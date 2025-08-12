// src/composables/useSearch.ts
import { ref, watch, computed, type Ref } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import type { SearchFile } from "@shared/entity/SearchFile";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";

export function useSearch(
  filters: Ref<{
    sites: string[];
    dateFrom: string;
    dateTo: string;
    products: string[];
    instruments: string[];
    instrumentPids: string[];
  }>,
) {
  const apiResponse = ref<SearchFileResponse | null>(null);
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const currentPage = ref(1);

  const results = computed<SearchFile[]>(() => apiResponse.value?.results || []);
  const pagination = computed(() => apiResponse.value?.pagination);

  let requestController: AbortController | null = null;

  const fetchData = async () => {
    if (requestController) {
      requestController.abort();
    }
    requestController = new AbortController();
    isLoading.value = true;
    error.value = null;

    try {
      const payload = {
        ...filters.value,
        showLegacy: true,
        privateFrontendOrder: true,
        page: currentPage.value,
      };
      const res = await axios.get<SearchFileResponse>(`${backendUrl}search`, {
        params: payload,
        signal: requestController.signal,
      });
      apiResponse.value = res.data;
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error(err);
      error.value = (axios.isAxiosError(err) && err.response?.statusText) || "unknown error";
    } finally {
      isLoading.value = false;
    }
  };

  watch(filters, () => {
    currentPage.value = 1;
    fetchData();
  });

  watch(currentPage, fetchData);

  fetchData();

  return {
    results,
    pagination,
    isLoading,
    error,
    currentPage,
  };
}
