<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
.metadata-container
  margin-top: auto
  font-size: 90%
</style>

<template>
  <div class="landing-summary-container">
    <div class="main-content">
      <div class="summary-box">
        <FileInformation :response="response" />
        <ProductInformation :response="response" :instrument="instrument" :instrumentStatus="instrumentStatus" />
        <DataOrigin :response="response" :isBusy="isBusy" :versions="versions" :sourceFiles="sourceFiles" />
        <div class="metadata-container">Metadata: <a :href="jsonUrl">JSON</a></div>
      </div>
    </div>
    <div class="side-content">
      <div class="summary-box">
        <Preview :visualization="visualization" :loading="loadingVisualizations" />
      </div>
      <div class="summary-box">
        <Citation />
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
  @Prop() instrument!: string | null;
  @Prop() instrumentStatus!: "loading" | "error" | "ready";
  @Prop() isBusy!: boolean;
  @Prop() versions!: string[];
  @Prop() sourceFiles!: RegularFile[];
  @Prop() visualizations!: VisualizationItem[];
  @Prop() loadingVisualizations!: boolean;

  get visualization() {
    if (this.visualizations && this.visualizations.length > 0) {
      return this.visualizations[0];
    } else {
      return null;
    }
  }

  get jsonUrl(): string {
    if (!this.response) return "";
    return `${process.env.VUE_APP_BACKENDURL}files/${this.response.uuid}`;
  }
}
</script>
