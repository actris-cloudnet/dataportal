<template>
  <BaseSearch mainWidth="pagewidth">
    <template #filters>
      <DateFilter />
      <ProductFilter />
      <InstrumentFilter />
    </template>
    <template #results>
      <ResultsData />
    </template>
  </BaseSearch>
</template>

<script setup lang="ts">
import BaseSearch from "@/components/search/BaseSearch.vue";
import DateFilter from "@/components/search/DateFilter.vue";
import InstrumentFilter from "@/components/search/InstrumentFilter.vue";
import ProductFilter from "@/components/search/ProductFilter.vue";
import ResultsData from "@/components/search/ResultsData.vue";
import { useSearch } from "@/composables/useSearch";
import { queryString, queryStringArray, useRouteQuery } from "@/lib/useRouteQuery";
import { computed, watch } from "vue";


//const searchFilters = computed(() => ({
//  sites: sites.value,
//  dateFrom: dateFrom.value,
//  dateTo: dateTo.value,
//  products: products.value,
//  instruments: instruments.value,
//  instrumentPids: instrumentPids.value,
//}));

//const { results, pagination, isLoading, error, currentPage } = useSearch(searchFilters);
</script>
