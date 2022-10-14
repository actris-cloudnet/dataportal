<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="summary-section" id="preview">
    <div class="summary-section-header">Preview</div>
    <Visualization v-if="visualization" :data="visualization" :caption="true" />
    <span v-else class="preview-loading">Loading...</span>
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
}
</script>
