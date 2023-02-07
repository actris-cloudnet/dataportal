<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="landing-summary-container">
    <div class="main-content">
      <div class="summary-box">
        <ProductInformation
          :response="response"
          :location="location"
          :instrument="instrument"
          :instrumentStatus="instrumentStatus"
        />
        <FileInformation :response="response" />
        <DataOrigin :response="response" :isBusy="isBusy" :versions="versions" :sourceFiles="sourceFiles" />
      </div>
    </div>
    <div class="side-content">
      <div class="summary-box">
        <Preview :visualization="visualization" :loading="loadingVisualizations" />
      </div>
      <div class="summary-box" id="citation" :class="{ volatile: response.volatile }">
        <Citation :uuid="uuid" :file="response" v-if="response" />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { SiteLocation } from "../../../../backend/src/entity/SiteLocation";
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";

import FileInformation from "./FileInformation.vue";
import ProductInformation from "./ProductInformation.vue";
import DataOrigin from "./DataOrigin.vue";
import Preview from "./Preview.vue";
import Citation from "./Citation.vue";

interface Props {
  response: ModelFile | RegularFile;
  location: SiteLocation | null;
  uuid: string;
  instrument: string | null;
  instrumentStatus: "loading" | "error" | "ready";
  isBusy: boolean;
  versions: string[];
  sourceFiles: RegularFile[];
  visualizations: VisualizationItem[];
  loadingVisualizations: boolean;
}

const props = defineProps<Props>();

const visualization = computed(() => {
  if (props.visualizations && props.visualizations.length > 0) {
    return props.visualizations[0];
  } else {
    return null;
  }
});
</script>
