import { ref, onMounted } from 'vue';
import axios from 'axios';
import type { Site } from '@shared/entity/Site';
import { backendUrl } from '@/lib';
import { alphabeticalSort } from '@/lib/SearchUtils';

export function useSites() {
  const allSites = ref<Site[]>([]);
  const error = ref<string | null>(null);
  const isLoading = ref(true);

  const fetchSites = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await axios.get<Site[]>(`${backendUrl}sites/`, { params: { type: ["cloudnet", "campaign", "arm"] } });
      const filteredSites = res.data.filter((site) => !site.type.includes("hidden"));
      allSites.value = filteredSites.sort(alphabeticalSort);
    } catch (e) {
      console.error("Failed to fetch sites:", e);
      error.value = "Could not load site data.";
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(fetchSites);

  return { allSites, error, isLoading, refetch: fetchSites };
}
