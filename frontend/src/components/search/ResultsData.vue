<template>Results</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useSearchStore } from "@/stores/search";

const searchStore = useSearchStore();

const { results, searchFilters, currentPage } = storeToRefs(searchStore);
const { performSearch } = searchStore;

watch(
  results,
  (newResults) => {
    console.log("Search results have been updated:", newResults);
  },
  { deep: true },
);

onMounted(() => {
  performSearch();
});

watch(
  searchFilters,
  () => {
    if (currentPage.value !== 1) {
      currentPage.value = 1;
    } else {
      performSearch();
    }
  },
  { deep: true },
);

watch(currentPage, () => {
  performSearch();
});
</script>
