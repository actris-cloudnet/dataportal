<template>
  <div>
    <h1>Monitoring Search</h1>
    <MonitoringSearchFilters
      :monitoring-products="monitoringProducts"
      v-model:selectedMonitoringProductIds="selectedMonitoringProductIds"
      v-model:selectedMonitoringVariableIds="selectedMonitoringVariableIds"
    />
    <MonitoringSearchResult :productIds="selectedMonitoringProductIds"/>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import MonitoringSearchResult from "@/components/MonitoringSearchResult.vue";
import MonitoringSearchFilters from "@/components/MonitoringSearchFilters.vue";
import type { MonitoringProduct } from "@shared/entity/Monitoring";

const monitoringProducts = ref<MonitoringProduct[]>([]);

const selectedMonitoringProductIds = ref<string[]>([]);
const selectedMonitoringVariableIds = ref<string[]>([]);

onMounted(async () => {
  try {
    const response = await axios.get<MonitoringProduct[]>(`${backendUrl}monitoring-products/variables`);
    monitoringProducts.value = response.data;
  } catch (err) {
    console.error("Failed to load monitoring products", err);
  }
});

watch(selectedMonitoringProductIds, (newValue, oldValue) => {
  console.log("selectedMonitoringProductIds changed:");
  console.log("Old value:", oldValue);
  console.log("New value:", newValue);
});
</script>

<style scoped lang="scss"></style>
