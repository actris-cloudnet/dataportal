<template>
  <div class="landing-visualizations-container pagewidth">
    <div class="summary-box" :class="{ obsolete: file.tombstoneReason }">
      <BaseSpinner v-if="loadingVisualizations" />
      <template v-else-if="visualizations.length > 0">
        <div class="visualizations">
          <Visualization
            v-for="visualization in visualizations"
            :key="visualization.productVariable.id"
            :data="visualization"
            :maxMarginLeft="maxMarginLeft"
            :maxMarginRight="maxMarginRight"
            expandable
            linkToVocabulary
          />
        </div>
        <div class="link-to-viz" v-if="!file.tombstoneReason">
          <router-link :to="linkToVisualizationSearch">View in visualisation search</router-link>
        </div>
      </template>
      <div v-else>No visualisations available.</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { FileResponse } from "@/views/FileView.vue";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import Visualization from "@/components/ImageVisualization.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";
import { useTitle } from "@/router";

export interface Props {
  file: FileResponse;
  visualizations: VisualizationItem[];
  loadingVisualizations: boolean;
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

const linkToVisualizationSearch = computed(() => {
  const response = props.file;
  return {
    name: "Search",
    params: { mode: "visualizations" },
    query: {
      site: response.site.id,
      product: response.product.id,
      dateFrom: response.measurementDate,
      dateTo: response.measurementDate,
      instrumentPid: "instrument" in response && response.instrument.pid ? response.instrument.pid : undefined,
    },
  };
});
</script>

<style scoped lang="scss">
.visualizations {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(700px, 100%), 1fr));
  gap: 1rem;
}
.link-to-viz {
  margin-top: 0.5rem;
}
</style>
