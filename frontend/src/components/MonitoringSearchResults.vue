<template>
  <div class="resultsHeader">
    <div v-if="isLoading" class="loading">Loading...</div>
    <div class="title" v-html="formattedDate"></div>
  </div>
  <div class="results">
    <div v-if="!isLoading && results.length == 0">No results</div>
    <MonitoringVisualization v-for="(item, index) in props.results" :key="index" :data="item" />
  </div>
</template>
<script setup lang="ts">
import type { MonitoringVisualization as MonitoringVisualizationResult } from "@shared/entity/Monitoring";
import MonitoringVisualization from "./MonitoringVisualization.vue";
import { computed } from "vue";
import { formatMonth, formatWeek, formatYear } from "@/lib/monitoringUtils";

const props = defineProps<{
  results: MonitoringVisualizationResult[];
  isLoading: boolean;
  error: Error | null;
  period: string;
  startDate: string | undefined;
}>();

const formattedDate = computed(() => {
  const { period, startDate } = props;
  if (period !== "all" && !startDate) return "";
  switch (period) {
    case "year":
      return formatYear(startDate!);
    case "month":
      return formatMonth(startDate!);
    case "week":
      return formatWeek(startDate!, "long");
    case "day":
      return startDate;
    case "all":
      return "All time";
    default:
      return "";
  }
});
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss" as vars;
.resultsHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  margin-bottom: 1rem;
  min-height: 2rem;

  .title {
    flex: 1 1 auto;
    text-align: center;
    color: vars.$gray5;
    font-size: large;
    font-weight: 400;
  }
  .loading {
    flex: 0 0 auto;
    color: vars.$gray1;
    text-align: start;
    white-space: nowrap;
    margin-right: 1rem;
  }
}
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
