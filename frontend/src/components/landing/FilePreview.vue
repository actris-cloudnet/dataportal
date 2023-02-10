<style scoped lang="sass">
@import "../../sass/landing-beta.sass"

.placeholder
  color: $GRAY-3-hex
  margin-top: .5*$basespacing
</style>

<template>
  <div class="summary-section" id="preview">
    <div class="summary-section-header">Preview</div>
    <div v-if="loading" class="placeholder">Loading...</div>
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
import Visualization from "../ImageVisualization.vue";

export interface Props {
  visualization: VisualizationItem | null;
  loading: boolean;
}

defineProps<Props>();
</script>
