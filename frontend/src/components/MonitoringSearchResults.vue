<template>
  <div class="results">
    <MonitoringVisualization v-for="(item, index) in props.results" :key="index" :data="item" />
  </div>
</template>
<script setup lang="ts">
import type { MonitoringVisualization as MonitoringVisualizationResult } from "@shared/entity/Monitoring";
import MonitoringVisualization from "./MonitoringVisualization.vue";

const props = defineProps<{
  results: MonitoringVisualizationResult[];
  isLoading: boolean;
  error: Error | null;
}>();
</script>

<style scoped lang="scss">
.results {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 1400px) {
  .results {
    grid-template-columns: 1fr;
  }
}

</style>
