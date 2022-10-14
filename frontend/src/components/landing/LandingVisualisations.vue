<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div v-if="active" class="landing-visualisations-container">
    <div class="visualisations-box">
      <div v-for="visualization in visualizations" :key="visualization.productVariable.id">
        <Visualization
          :data="visualization"
          :maxMarginLeft="maxMarginLeft"
          :maxMarginRight="maxMarginRight"
          :caption="true"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";
import Visualization from "../Visualization.vue";

@Component({ components: { Visualization } })
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
