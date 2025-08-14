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
        />
      </aside>
      <main id="results">
        <MonitoringSearchResults :results="results" :isLoading="isLoading" :error="error" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import MonitoringSearchFilters from "@/components/MonitoringSearchFilters.vue";
import { useRouteQuery, queryStringArray } from "@/lib/useRouteQuery";
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
  console.log("Filtered siteOptions:", filtered);
  return filtered;
});

const searchFilters = computed(() => ({
  productIds: selectedProductIds.value,
  variableIds: selectedVariableIds.value,
  siteIds: selectedSiteIds.value,
}));

const { results, isLoading, error } = useMonitoringQuery(searchFilters);

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
  max-width: none;
  padding-left: $heavypadding;
  padding-right: $heavypadding;
}

#searchContainer {
  display: flex;
  justify-content: center;
}

#sideBar {
  margin-right: 80px;
  padding: 2rem 0;
  flex-basis: 400px;
  flex-shrink: 0;
}
main#results {
  display: inline-flex;
  flex-grow: 1;
}
</style>
