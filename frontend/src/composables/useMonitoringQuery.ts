import { ref, type Ref, watch } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import type { MonitoringVisualization } from "@shared/entity/Monitoring";

export interface MonitoringFilters {
  productIds: string[];
  variableIds: string[];
  siteIds: string[];
  instrumentUuids: string[];
  period: string;
  startDate: string | undefined;
}

function filtersToQueryParams(filters: MonitoringFilters) {
  const params: Record<string, string | string[]> = {};
  params.productId = filters.productIds;
  params.variableId = filters.variableIds;
  params.siteId = filters.siteIds;
  params.instrumentUuid = filters.instrumentUuids;
  params.period = filters.period;
  params.startDate = filters.startDate ? filters.startDate : [];
  if (params.period === "all") {
    params.startDate = [];
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
        const queryParams = filtersToQueryParams(newFilters);
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
