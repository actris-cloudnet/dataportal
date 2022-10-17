<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div v-if="active" class="landing-summary-container">
    <div class="main-content">
      <div class="summary-box">
        <FileInformation :response="response" />
        <ProductInformation :response="response" :instrument="instrument" :model="model" />
        <DataOrigin :response="response" :isBusy="isBusy" :versions="versions" :sourceFiles="sourceFiles" />
      </div>
    </div>
    <div class="side-content">
      <div class="summary-box">
        <Preview :visualization="visualization" :loading="loadingVisualization" />
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
import { Model } from "../../../../backend/src/entity/Model";

import FileInformation from "./FileInformation.vue";
import ProductInformation from "./ProductInformation.vue";
import DataOrigin from "./DataOrigin.vue";
import Preview from "./Preview.vue";
import Citation from "./Citation.vue";

@Component({ components: { FileInformation, ProductInformation, DataOrigin, Preview, Citation } })
export default class LandingSummary extends Vue {
  @Prop() active!: boolean;
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() instrument!: string | null;
  @Prop() model!: Model | null;
  @Prop() isBusy!: boolean;
  @Prop() versions!: string[];
  @Prop() sourceFiles!: RegularFile[];
  @Prop() visualization!: VisualizationItem | null;
  @Prop() loadingVisualization!: boolean;
}
</script>
