<template>
  <SearchData v-if="mode === 'data'" />
  <SearchVisualization v-else-if="mode === 'visualizations'" />
  <SearchMonitoring v-else-if="mode === 'monitoring'" />
  <div v-else>
    Errors :(
  </div>
  
  
</template>

<script setup lang="ts">
import SearchData from '@/components/search/SearchData.vue';
import SearchMonitoring from '@/components/search/SearchMonitoring.vue';
import SearchVisualization from '@/components/search/SearchVisualization.vue';
export interface Props {
  mode: string;
}
const props = defineProps<Props>();
</script>
