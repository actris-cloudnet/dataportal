import { ref, onMounted } from 'vue';
import axios from 'axios';
import type { Product } from "@shared/entity/Product";
import { backendUrl } from '@/lib';
import { alphabeticalSort } from '@/lib/SearchUtils';

export function useProducts() {
  const allProducts = ref<Product[]>([]);
  const error = ref<string | null>(null);
  const isLoading = ref(true);

  const fetchProducts = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await axios.get<Product[]>(`${backendUrl}products/variables`);
      allProducts.value = res.data.sort(alphabeticalSort);
    } catch (e) {
      console.error("Failed to fetch products:", e);
      error.value = "Could not load product data.";
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(fetchProducts);

  return { allProducts, error, isLoading, refetch: fetchProducts };
}
