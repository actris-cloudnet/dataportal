<style scoped lang="sass">
.caption
  text-align: center
  font-weight: 400

.visualization
  width: 100%
  height: auto
</style>

<template>
  <div v-if="caption">
    <div class="caption">
      {{ data.productVariable.humanReadableName }}
    </div>
    <img
      :src="quicklookUrl + data.s3key"
      :width="data.dimensions && data.dimensions.width"
      :height="data.dimensions && data.dimensions.height"
      alt=""
      class="visualization"
      :style="imageStyle"
    />
  </div>
  <!-- TODO: remove legacy layout in the future. -->
  <img
    v-else
    :src="quicklookUrl + data.s3key"
    :width="data.dimensions && data.dimensions.width"
    :height="data.dimensions && data.dimensions.height"
    alt=""
    class="visualization"
    :style="imageStyle"
  />
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";
import { VisualizationItem } from "../../../backend/src/entity/VisualizationResponse";

@Component
export default class Visualization extends Vue {
  @Prop() data!: VisualizationItem;
  @Prop() maxMarginLeft?: number;
  @Prop() maxMarginRight?: number;
  @Prop({ default: false }) caption!: boolean;

  get imageStyle() {
    if (
      !this.data.dimensions ||
      typeof this.maxMarginLeft === "undefined" ||
      typeof this.maxMarginRight === "undefined"
    ) {
      return {};
    }
    const left = this.maxMarginLeft - this.data.dimensions.marginLeft;
    const right = this.maxMarginRight - this.data.dimensions.marginRight;
    const width = this.data.dimensions.width + left + right;
    return {
      paddingLeft: `${(100 * left) / width}%`,
      paddingRight: `${(100 * right) / width}%`,
    };
  }

  quicklookUrl = `${process.env.VUE_APP_BACKENDURL}download/image/`;
}
</script>
