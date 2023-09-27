<style scoped lang="sass">
@import "@/sass/landing-beta.sass"
</style>

<template>
  <div class="landing-summary-container pagewidth">
    <div class="summary-box summary-box-product-information">
      <ProductInformation
        :response="response"
        :location="location"
        :instrument="instrument"
        :instrumentStatus="instrumentStatus"
      />
      <FileInformation :response="response" />
      <DataOrigin :response="response" :isBusy="isBusy" :versions="versions" :sourceFiles="sourceFiles" />
    </div>
    <div class="summary-box summary-box-visualization">
      <Preview :visualization="visualization" :loading="loadingVisualizations" />
    </div>
    <div class="summary-box summary-box-citation" id="citation" :class="{ volatile: response.volatile }">
      <Citation :uuid="uuid" :file="response" v-if="response" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import type { SiteLocation } from "@shared/entity/SiteLocation";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";

import FileInformation from "./FileInformation.vue";
import ProductInformation from "./ProductInformation.vue";
import DataOrigin from "./DataOrigin.vue";
import Preview from "./FilePreview.vue";
import Citation from "./FileCitation.vue";
import type { SourceFile, FileResponse } from "@/views/FileView.vue";
import { useTitle } from "@/router";

export interface Props {
  response: FileResponse;
  location: SiteLocation | null;
  uuid: string;
  instrument: string | null;
  instrumentStatus: "loading" | "error" | "ready";
  isBusy: boolean;
  versions: string[];
  sourceFiles: SourceFile[];
  visualizations: VisualizationItem[];
  loadingVisualizations: boolean;
  title: string;
}

const props = defineProps<Props>();

useTitle(["Summary", props.title]);

const visualization = computed(() => {
  if (props.visualizations && props.visualizations.length > 0) {
    return props.visualizations[0];
  } else {
    return null;
  }
});
</script>
