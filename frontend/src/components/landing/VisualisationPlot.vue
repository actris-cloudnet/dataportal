<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div>
    <img
      v-if="data"
      img
      :src="quicklookUrl + data.s3key"
      class="visualisation-img"
      :width="width"
      :height="height"
      :style="style"
    />
  </div>
</template>

<script lang="ts">
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";

@Component
export default class VisualisationPlot extends Vue {
  @Prop() data!: VisualizationItem;
  @Prop() maxMarginLeft!: number;
  @Prop() maxMarginRight!: number;
  quicklookUrl = `${process.env.VUE_APP_BACKENDURL}download/image/`;

  get width() {
    if (!this.data.dimensions) return null;
    return this.data.dimensions.width + this.maxMarginLeft + this.maxMarginRight;
  }
  get height() {
    if (!this.data.dimensions) return null;
    return this.data.dimensions.height;
  }

  get leftShift() {
    if (!this.data.dimensions) return null;
    return this.maxMarginLeft - this.data.dimensions.marginLeft;
  }
  get rightShift() {
    if (!this.data.dimensions) return null;
    return this.maxMarginRight - this.data.dimensions.marginRight;
  }

  get leftPadding() {
    if (!this.data.dimensions) return null;
    return (100 * this.leftShift!) / this.width!;
  }
  get rightPadding() {
    if (!this.data.dimensions) return null;
    return (100 * this.rightShift!) / this.width!;
  }

  get style() {
    if (!this.data.dimensions) return {};
    return {
      paddingLeft: `${this.leftPadding}%`,
      paddingRight: `${this.rightPadding}%`,
    };
  }
}
</script>
