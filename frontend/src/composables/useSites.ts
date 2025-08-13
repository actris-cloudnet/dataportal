import { ref, onMounted } from 'vue';
import axios from 'axios';
import { backendUrl } from '@/lib';
import type {Site} from "@shared/entity/Site";

export function useSites() {
  const sites = ref<Site[]>([]);
  const isLoading = ref(true); 
  const error = ref<Error | null>(null); 

  const fetchSites = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await axios.get<Site[]>(`${backendUrl}sites/`, { params: { type: ["cloudnet", "campaign", "arm"] } });
      sites.value = response.data.filter((site) => !site.type.includes("hidden"));
    } catch (err: any) {
      console.error("Failed to load sites", err);
      error.value = err;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(fetchSites);

  return {
    sites,
    isLoading,
    error,
  };
}

