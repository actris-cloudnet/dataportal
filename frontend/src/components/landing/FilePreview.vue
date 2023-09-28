<style scoped lang="sass">
@import "@/sass/landing-beta.sass"
</style>

<template>
  <div class="summary-section" id="preview">
    <div class="summary-section-header">Preview</div>
    <BaseSpinner v-if="loading" />
    <Visualization
      v-else-if="visualization"
      :data="visualization"
      :caption="true"
      :linkTo="{ name: 'FileVisualizations' }"
    />
    <div v-else class="placeholder">Not available.</div>
  </div>
</template>

<script lang="ts" setup>
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import Visualization from "@/components/ImageVisualization.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";

export interface Props {
  visualization: VisualizationItem | null;
  loading: boolean;
}

defineProps<Props>();
</script>
