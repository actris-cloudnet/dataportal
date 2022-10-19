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
      :linkTo="{ name: 'FileBetaVisualizations' }"
    />
    <div v-else class="placeholder">Not available.</div>
  </div>
</template>

<script lang="ts">
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";
import { Component, Prop } from "vue-property-decorator";
import Visualization from "../Visualization.vue";
import Vue from "vue";

@Component({ components: { Visualization } })
export default class Preview extends Vue {
  @Prop() visualization!: VisualizationItem | null;
  @Prop() loading!: boolean;
}
</script>
