import { ref, onMounted } from 'vue';
import axios from 'axios';
import { backendUrl } from '@/lib';
import type { MonitoringProduct } from "@shared/entity/Monitoring";

export function useMonitoringProducts() {
  const monitoringProducts = ref<MonitoringProduct[]>([]);
  const isLoading = ref(true); 
  const error = ref<Error | null>(null); 

  const fetchMonitoringProducts = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await axios.get<MonitoringProduct[]>(`${backendUrl}monitoring-products/variables`);
      monitoringProducts.value = response.data;
    } catch (err: any) {
      console.error("Failed to load monitoring products", err);
      error.value = err;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(fetchMonitoringProducts);

  return {
    monitoringProducts,
    isLoading,
    error,
  };
}

