<template>
  <div id="monitoringSearch">
    <div id="searchContainer">
      <aside id="sideBar">
        <MonitoringSearchFilters
          :monitoringProducts="monitoringProducts"
          :siteOptions="siteOptions"
          v-model:selectedProductIds="selectedProductIds"
          v-model:selectedVariableIds="selectedVariableIds"
          v-model:selectedSiteIds="selectedSiteIds"
          v-model:period="period"
        />
      </aside>
      <main id="results">
        <MonitoringSearchResults :results="results" :isLoading="isLoading" :error="error" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import MonitoringSearchFilters from "@/components/MonitoringSearchFilters.vue";
import { useRouteQuery, queryStringArray, queryString } from "@/lib/useRouteQuery";
import { useMonitoringProducts } from "@/composables/useMonitoringProducts";
import { useSites } from "@/composables/useSites";
import { useMonitoringQuery } from "@/composables/useMonitoringQuery";
import MonitoringSearchResults from "@/components/MonitoringSearchResults.vue";

const { monitoringProducts } = useMonitoringProducts();
const selectedProductIds = useRouteQuery({ name: "productId", defaultValue: [], type: queryStringArray });
const selectedVariableIds = useRouteQuery({ name: "variableId", defaultValue: [], type: queryStringArray });

const { sites } = useSites();
const selectedSiteIds = useRouteQuery({ name: "site", defaultValue: [], type: queryStringArray });
const siteOptions = computed(() => {
  const filtered = sites.value.filter((site) => site.type.includes("cloudnet"));
  return filtered;
});
const period = useRouteQuery({ name: "period", defaultValue: "month", type: queryString });

const searchFilters = computed(() => ({
  productIds: selectedProductIds.value,
  variableIds: selectedVariableIds.value,
  siteIds: selectedSiteIds.value,
  period: period.value,
}));

const { results, isLoading, error } = useMonitoringQuery(searchFilters);

watch(period, (newValue, oldValue) => {
  console.log("period changed in MonitoringView:");
  console.log("Old value:", oldValue);
  console.log("New value:", newValue);
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
watch(siteOptions, (n, o) => {
  console.log("Old sites", o);
  console.log("New sites", n);
});
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

$lightpadding: 1rem;
$heavypadding: 5rem;
$filter-margin: 2em;

#monitoringSearch {
  padding-left: $heavypadding;
  padding-right: $heavypadding;
}

#searchContainer {
  display: flex;
  justify-content: center;
}

#sideBar {
  flex-basis: 400px;
  flex-shrink: 0;
  margin-right: 80px;
  padding: 2rem 0;
  max-width: 400px;
}
main#results {
  flex-grow: 1;
  min-width: 300px;
}
@media (max-width: 1024px) {
  #monitoringSearch {
    padding-left: $lightpadding;
    padding-right: $lightpadding;
  }

  #searchContainer {
    flex-direction: column;
    align-items: center;
  }

  #sideBar {
    margin-right: 0;
    margin-bottom: 2rem;
    width: 100%;
    max-width: 700px;
  }
  main#results {
    width: 100%;
    max-width: 700px;
  }
}
</style>
