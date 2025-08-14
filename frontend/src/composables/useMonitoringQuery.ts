import { ref, type Ref, watch } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import type { MonitoringVisualization } from "@shared/entity/Monitoring";

export interface MonitoringFilters {
  productIds: string[];
  variableIds: string[];
  siteIds: string[];
}

function filters_to_query_params(filters: MonitoringFilters) {
  const params: Record<string, string> = {};
  if (filters.productIds.length > 0) {
    params.productId = filters.productIds.join(",");
  }
  if (filters.variableIds.length > 0) {
    params.variableId = filters.variableIds.join(",");
  }
  if (filters.siteIds.length > 0) {
    params.siteId = filters.siteIds.join(",");
  }
  return params;
}

export function useMonitoringQuery(filters: Ref<MonitoringFilters>) {
  const results = ref<MonitoringVisualization[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  let controller: AbortController | null = null;

  watch(
    filters,
    async (newFilters) => {
      if (controller) {
        controller.abort();
      }
      controller = new AbortController();
      const signal = controller.signal;
      isLoading.value = true;
      error.value = null;
      results.value = [];
      try {
        const queryParams = filters_to_query_params(newFilters);
        const response = await axios.get(`${backendUrl}monitoring-visualizations/`, {
          signal: signal,
          params: queryParams,
        });
        results.value = response.data;
      } catch (err: any) {
        error.value = err;
      } finally {
        isLoading.value = false;
      }
    },
    { deep: true, immediate: true },
  );
  return { results, isLoading, error };
}
