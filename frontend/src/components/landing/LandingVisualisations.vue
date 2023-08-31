<style scoped lang="sass">
@import "@/sass/landing-beta.sass"
</style>

<template>
  <div class="landing-visualisations-container">
    <div v-if="visualizations.length > 0" class="visualisations-box">
      <div v-for="visualization in visualizations" :key="visualization.productVariable.id">
        <Visualization
          :data="visualization"
          :maxMarginLeft="maxMarginLeft"
          :maxMarginRight="maxMarginRight"
          :caption="true"
          :expandable="true"
        />
      </div>
    </div>
    <div v-else class="visualisations-box">No visualisations available.</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { FileResponse } from "@/views/FileView.vue";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import Visualization from "@/components/ImageVisualization.vue";
import { useTitle } from "@/router";

export interface Props {
  response: FileResponse;
  visualizations: VisualizationItem[];
  title: string;
}

const props = defineProps<Props>();

useTitle(["Visualisations", props.title]);

const maxMarginLeft = computed(() => {
  let max = 0;
  for (const v of props.visualizations) {
    if (v.dimensions) {
      max = Math.max(max, v.dimensions.marginLeft);
    }
  }
  return max;
});

const maxMarginRight = computed(() => {
  let max = 0;
  for (const v of props.visualizations) {
    if (v.dimensions) {
      max = Math.max(max, v.dimensions.marginRight);
    }
  }
  return max;
});
</script>
