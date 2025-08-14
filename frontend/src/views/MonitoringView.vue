<template>
  <div id="monitoringSearch">
    <div id="searchContainer">
      <aside id="sideBar">
        <SuperMap
          :key="mapKey"
          :sites="siteOptions"
          :selectedSiteIds="selectedSiteIds"
          :onMapMarkerClick="onMapMarkerClick"
          :center="[55, 12.0]"
          :zoom="3.5"
          enableBoundingBox
          class="map"
        />
        <MonitoringSearchFilters
          :monitoring-products="monitoringProducts"
          v-model:selectedProductIds="selectedProductIds"
          v-model:selectedVariableIds="selectedVariableIds"
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
import SuperMap from "@/components/SuperMap.vue";
import { useMonitoringProducts } from "@/composables/useMonitoringProducts";
import { useSites } from "@/composables/useSites";
import { useMonitoringQuery } from "@/composables/useMonitoringQuery";
import MonitoringSearchResults from "@/components/MonitoringSearchResults.vue";

const { monitoringProducts } = useMonitoringProducts();
const selectedProductIds = useRouteQuery({ name: "productId", defaultValue: [], type: queryStringArray });
const selectedVariableIds = useRouteQuery({ name: "variableId", defaultValue: [], type: queryStringArray });

const { sites } = useSites();
const selectedSiteIds = useRouteQuery({ name: "site", defaultValue: [], type: queryStringArray });
const siteOptions = computed(() => sites.value.filter((site) => site.type.includes("cloudnet")));
const mapKey = ref(0); // Supermap does not update if the props update. This forces the update

const searchFilters = computed(() => ({
  productIds: selectedProductIds.value,
  variableIds: selectedVariableIds.value,
  siteIds: selectedSiteIds.value,
}));

const { results, isLoading, error } = useMonitoringQuery(searchFilters);

function onMapMarkerClick(ids: string[]) {
  const union = selectedSiteIds.value.concat(ids);
  const intersection = selectedSiteIds.value.filter((id) => ids.includes(id));
  selectedSiteIds.value = union.filter((id) => !intersection.includes(id));
}

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
  mapKey.value = Math.random();
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
.map {
  height: 550px;
}
</style>
