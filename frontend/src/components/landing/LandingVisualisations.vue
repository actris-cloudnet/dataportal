<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="landing-visualisations-container">
    <div v-if="visualizations.length > 0" class="visualisations-box">
      <div v-for="visualization in visualizations" :key="visualization.productVariable.id">
        <Visualization
          :data="visualization"
          :maxMarginLeft="maxMarginLeft"
          :maxMarginRight="maxMarginRight"
          :caption="true"
          :expandable="true"
        />
        <DynamicVisualization
          v-if="data"
          :variable="visualization.productVariable.id.slice(visualization.productVariable.id.indexOf('-') + 1)"
          :data="data"
        />
      </div>
    </div>
    <div v-else class="visualisations-box">No visualisations available.</div>
  </div>
</template>
<script lang="ts">
import axios from "axios";
import { Component, Prop, Vue } from "vue-property-decorator";
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";
import Visualization from "../Visualization.vue";
import DynamicVisualization from "../DynamicVisualization.vue";

@Component({ components: { Visualization, DynamicVisualization } })
export default class LandingVisualisations extends Vue {
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() visualizations!: VisualizationItem[];

  data: any = null;

  async mounted() {
    if (!this.response) return;
    const res = await axios.get(`http://localhost:8000/${this.response.uuid}/${this.response.filename}`);
    this.data = res.data;
  }

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
