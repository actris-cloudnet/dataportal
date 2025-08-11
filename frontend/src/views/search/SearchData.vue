<template>
  <BaseSearch mainWidth="pagewidth">
    <template #filters>
      <DateFilter /> 
      <ProductFilter />
      <InstrumentFilter />
    </template>
    <template #results></template>
  </BaseSearch>
</template>

<script setup lang="ts">
import BaseSearch from '@/components/search/BaseSearch.vue';
import DateFilter from '@/components/search/DateFilter.vue';
import InstrumentFilter from '@/components/search/InstrumentFilter.vue';
import ProductFilter from '@/components/search/ProductFilter.vue';

</script>
