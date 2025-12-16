import { backendUrl } from "@/lib";
import axios from "axios";
import { onMounted, ref } from "vue";

export interface AvailablePeriods {
  all: null[] | undefined;
  year: string[] | undefined;
  month: string[] | undefined;
  week: string[] | undefined;
  day: string[] | undefined;
}

export function useMonitoringPeriods() {
  const results = ref<AvailablePeriods>();
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  async function fetch() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await axios.get(`${backendUrl}monitoring-files/available-periods`);
      results.value = response.data;
    } catch (err: any) {
      error.value = err;
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(fetch);

  return {
    results,
    isLoading,
    error,
    refresh: fetch,
  };
}
