<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="landing-summary-container">
    <div class="main-content">
      <div class="summary-box">
        <ProductInformation :response="response" :instrument="instrument" :instrumentStatus="instrumentStatus" />
        <FileInformation :response="response" />
        <DataOrigin :response="response" :isBusy="isBusy" :versions="versions" :sourceFiles="sourceFiles" />
      </div>
    </div>
    <div class="side-content">
      <div class="summary-box">
        <Preview :visualization="visualization" :loading="loadingVisualizations" />
      </div>
      <div class="summary-box" id="citation" :class="{ volatile: isVolatile }">
        <Citation :uuid="uuid" :file="response" />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";

import FileInformation from "./FileInformation.vue";
import ProductInformation from "./ProductInformation.vue";
import DataOrigin from "./DataOrigin.vue";
import Preview from "./Preview.vue";
import Citation from "./Citation.vue";

@Component({ components: { FileInformation, ProductInformation, DataOrigin, Preview, Citation } })
export default class LandingSummary extends Vue {
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() uuid!: string;
  @Prop() instrument!: string | null;
  @Prop() instrumentStatus!: "loading" | "error" | "ready";
  @Prop() isBusy!: boolean;
  @Prop() versions!: string[];
  @Prop() sourceFiles!: RegularFile[];
  @Prop() visualizations!: VisualizationItem[];
  @Prop() loadingVisualizations!: boolean;

  get isVolatile() {
    return this.response ? this.response.volatile : false;
  }

  get visualization() {
    if (this.visualizations && this.visualizations.length > 0) {
      return this.visualizations[0];
    } else {
      return null;
    }
  }
}
</script>
