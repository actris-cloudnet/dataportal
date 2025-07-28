import { ref, onMounted } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import type { Instrument } from "@shared/entity/Instrument";

export function useMonitoringInstruments() {
  const instruments = ref<Instrument[]>([]);
  const isLoading = ref(true);
  const error = ref<Error | null>(null);

  const fetchInstruments = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await axios.get<Instrument[]>(`${backendUrl}monitoring-files/available-instruments`);
      instruments.value = response.data;
    } catch (err: any) {
      error.value = err;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(fetchInstruments);

  return {
    instruments,
    isLoading,
    error,
  };
}
