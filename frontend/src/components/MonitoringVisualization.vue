<template>
  <div class="monitoring-visualization">
    <div class="header">
      {{ props.data.sourceFile.monitoringProduct.humanReadableName }} -
      {{ props.data.monitoringProductVariable.humanReadableName }},&nbsp;
      <a :href="`/site/${props.data.sourceFile.site.id}`"> {{ props.data.sourceFile.site.humanReadableName }} </a
      >,&nbsp;
      <a :href="`/instrument/${props.data.sourceFile.instrumentInfo.uuid}`">
        {{ props.data.sourceFile.instrumentInfo.name }}
      </a>
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
const imageUrl = computed(() => `${backendUrl}download/image/${props.data.s3key}`);
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss" as vars;
.monitoring-visualization {
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
}

.header {
  text-align: center;
  color: vars.$gray5;
  margin-bottom: 0.5rem;
  p {
    margin: 0;
    line-height: 1.4;
    word-break: break-word;
  }
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  padding: 0 1rem;
}
</style>
