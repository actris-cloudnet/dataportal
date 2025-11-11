<template>
  <div id="monitoringSearch">
    <div id="searchContainer">
      <aside id="sideBar">
        <MonitoringSearchFilters
          :monitoringProducts="monitoringProducts"
          :siteOptions="sites"
          :instruments="instruments"
          v-model:selectedProductIds="selectedProductIds"
          v-model:selectedVariableIds="selectedVariableIds"
          v-model:selectedSiteIds="selectedSiteIds"
          v-model:selectedInstrumentUuids="selectedInstrumentUuids"
          v-model:period="period"
          v-model:startDate="startDate"
        />
      </aside>
      <main id="results">
        <MonitoringSearchResults
          :results="results"
          :isLoading="isLoading"
          :error="error"
          :period="period"
          :startDate="startDate"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import MonitoringSearchFilters from "@/components/MonitoringSearchFilters.vue";
import { useRouteQuery, queryStringArray, queryString } from "@/lib/useRouteQuery";
import { useMonitoringProducts } from "@/composables/useMonitoringProducts";
import { useMonitoringSites } from "@/composables/useMonitoringSites";
import { useMonitoringInstruments } from "@/composables/useMonitoringInstruments";
import { useMonitoringQuery } from "@/composables/useMonitoringQuery";
import MonitoringSearchResults from "@/components/MonitoringSearchResults.vue";

const { monitoringProducts } = useMonitoringProducts();
const selectedProductIds = useRouteQuery({ name: "productId", defaultValue: [], type: queryStringArray });
const selectedVariableIds = useRouteQuery({ name: "variableId", defaultValue: [], type: queryStringArray });

const { sites } = useMonitoringSites();
const selectedSiteIds = useRouteQuery({ name: "site", defaultValue: [], type: queryStringArray });
const { instruments } = useMonitoringInstruments();
const selectedInstrumentUuids = useRouteQuery({ name: "instrumentUuid", defaultValue: [], type: queryStringArray });
const period = useRouteQuery({ name: "period", defaultValue: "all", type: queryString });
const startDate = useRouteQuery({ name: "startDate", defaultValue: undefined, type: queryString });

const searchFilters = computed(() => ({
  productIds: selectedProductIds.value,
  variableIds: selectedVariableIds.value,
  siteIds: selectedSiteIds.value,
  instrumentUuids: selectedInstrumentUuids.value,
  period: period.value,
  startDate: startDate.value,
}));

const { results, isLoading, error } = useMonitoringQuery(searchFilters);
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
  flex-basis: 300px;
  flex-shrink: 0;
  margin-right: 80px;
  padding: 2rem 0;
  max-width: 300px;
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
    max-width: 500px;
  }
  main#results {
    width: 100%;
    margin: 0 1rem;
  }
}
</style>
