<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="summary-section" id="preview">
    <div class="summary-section-header">Preview</div>
    <span v-if="visualization" class="preview-caption">{{ visualization.productVariable.humanReadableName }} </span>
    <span v-if="visualization">
      <PreviewPlot :data="visualization" />
    </span>
    <span v-else class="preview-loading"> Loading </span>
  </div>
</template>

<script lang="ts">
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";
import { Component, Prop } from "vue-property-decorator";
import PreviewPlot from "../../components/landing/PreviewPlot.vue";
import Vue from "vue";

@Component({ components: { PreviewPlot } })
export default class Preview extends Vue {
  @Prop() visualization!: VisualizationItem | null;
}
</script>
