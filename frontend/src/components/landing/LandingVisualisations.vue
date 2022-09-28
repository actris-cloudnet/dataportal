<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div v-if="active" class="landing-visualisations-container">
    <div class="visualisations-box">
      <div v-for="visualization in visualizations" :key="visualization.productVariable.id">
        <div class="visualisation-container">
          <div class="visualisation-caption">
            {{ visualization.productVariable.humanReadableName }}
          </div>
          <div>
            <VisualisationPlot :data="visualization" :maxMarginLeft="maxMarginLeft" :maxMarginRight="maxMarginRight" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";
import Visualization from "../Visualization.vue";
import VisualisationPlot from "./VisualisationPlot.vue";

@Component({ components: { VisualisationPlot, Visualization } })
export default class LandingVisualisations extends Vue {
  @Prop() active!: boolean;
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() visualizations!: VisualizationItem[];

  get maxMarginLeft() {
    let max = 0;
    for (const v of this.visualizations) {
      if (v.dimensions) {
        max = Math.max(max, v.dimensions.marginLeft);
      }
    }
    return max;
  }
  get maxMarginRight() {
    let max = 0;
    for (const v of this.visualizations) {
      if (v.dimensions) {
        max = Math.max(max, v.dimensions.marginRight);
      }
    }
    return max;
  }
}
</script>
