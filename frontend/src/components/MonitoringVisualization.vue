<template>
  <div class="monitoring-visualization">
    <div class="header">
      <div class="site">{{ props.data.sourceFile.site.humanReadableName }}</div>
      <div class="instrument">
        <a :href="props.data.sourceFile.instrumentInfo.pid">{{ props.data.sourceFile.instrumentInfo.name }}</a>
      </div>
      <div class="period">{{ props.data.sourceFile.periodType }}/{{ props.data.sourceFile.startDate }}</div>
      <div class="product">{{ props.data.sourceFile.monitoringProduct.humanReadableName }}</div>
      <div class="variable">{{ props.data.monitoringProductVariable.humanReadableName }}</div>
    </div>
    <img
      v-if="imageUrl"
      :src="imageUrl"
      loading="lazy"
      :alt="`Visualization for ${props.data.monitoringProductVariable.humanReadableName}`"
      :width="props.data.width"
      :height="props.data.height"
    />
    <div v-else>No image available.</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { backendUrl } from "@/lib";
import type { MonitoringVisualization as VisualizationData } from "@shared/entity/Monitoring";

const props = defineProps<{ data: VisualizationData }>();

const imageUrl = computed(() => (props.data?.s3key ? `${backendUrl}download/image/${props.data.s3key}` : null));
</script>

<style scoped lang="scss">
.monitoring-visualization {
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
}

.header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  text-align: center;
}
.header .site {
  grid-row: 1;
  grid-column: 1;
}
.header .instrument {
  grid-row: 1;
  grid-column: 2;
}
.header .period {
  grid-row: 1;
  grid-column: 3;
}
.header .product {
  grid-row: 2;
  grid-column: 1;
}
.header .variable {
  grid-row: 2;
  grid-column: 2;
}
img {
  max-width: 100%;
  height: auto;
  display: block;
  padding: 0 2rem;
}
</style>
