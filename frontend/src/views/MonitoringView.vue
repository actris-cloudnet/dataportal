<template>
  <div>
    <h1>Monitoring Search</h1>
    <MonitoringSearchFilters
      :monitoring-products="monitoringProducts"
      v-model:selectedProductIds="selectedProductIds"
      v-model:selectedVariableIds="selectedVariableIds"
    />
    <MonitoringSearchResult :productIds="selectedProductIds" :variableIds="selectedVariableIds" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import MonitoringSearchResult from "@/components/MonitoringSearchResult.vue";
import MonitoringSearchFilters from "@/components/MonitoringSearchFilters.vue";
import type { MonitoringProduct } from "@shared/entity/Monitoring";
import { useRouteQuery, queryBoolean, queryString, queryStringArray } from "@/lib/useRouteQuery";
import SuperMap from "@/components/SuperMap.vue";

const monitoringProducts = ref<MonitoringProduct[]>([]);

const selectedProductIds = useRouteQuery({ name: "productId", defaultValue: [], type: queryStringArray });
const selectedVariableIds = useRouteQuery({ name: "variableId", defaultValue: [], type: queryStringArray });

onMounted(async () => {
  try {
    const response = await axios.get<MonitoringProduct[]>(`${backendUrl}monitoring-products/variables`);
    monitoringProducts.value = response.data;
  } catch (err) {
    console.error("Failed to load monitoring products", err);
  }
});

watch(selectedProductIds, (newValue, oldValue) => {
  console.log("selectedProductIds changed in MonitoringView:");
  console.log("Old value:", oldValue);
  console.log("New value:", newValue);
});
watch(selectedVariableIds, (newValue, oldValue) => {
  console.log("selectedVariableIds changed in MonitoringView:");
  console.log("Old value:", oldValue);
  console.log("New value:", newValue);
});
</script>

<style scoped lang="scss"></style>
