<template>
  <div class="landing-summary-container pagewidth">
    <div class="summary-box summary-box-product-information" :class="{ obsolete: response.tombstoneReason }">
      <ProductInformation :response="response" :location="location" />
      <FileInformation :response="response" />
      <FileProvenance :response="response" :isBusy="isBusy" :versions="versions" :sourceFiles="sourceFiles" />
    </div>
    <div class="summary-box summary-box-visualization" :class="{ obsolete: response.tombstoneReason }">
      <FilePreview :visualization="visualization" :loading="loadingVisualizations" />
    </div>
    <div
      class="summary-box summary-box-citation"
      id="citation"
      :class="{ volatile: response.volatile, obsolete: response.tombstoneReason }"
    >
      <FileCitation :uuid="uuid" :file="response" v-if="response" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { SiteLocation } from "@shared/entity/SiteLocation";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";

import FileInformation from "./FileInformation.vue";
import ProductInformation from "./ProductInformation.vue";
import FileProvenance from "./FileProvenance.vue";
import FilePreview from "./FilePreview.vue";
import FileCitation from "./FileCitation.vue";
import type { FileResponse } from "@/views/FileView.vue";
import { useTitle } from "@/router";

export interface Props {
  response: FileResponse;
  location: SiteLocation | null;
  uuid: string;
  isBusy: boolean;
  versions: string[];
  sourceFiles: FileResponse[];
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

<style scoped lang="scss">
@import "@/sass/variables.scss";

.landing-summary-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.summary-box-product-information {
  grid-row: 1 / 3;
  grid-column: 1;
}

.summary-box-visualization {
  grid-row: 1;
  grid-column: 2;
}

.summary-box-citation {
  grid-row: 2;
  grid-column: 2;
}

@media screen and (max-width: 1000px) {
  .landing-summary-container {
    grid-template-columns: 1fr;
    margin-bottom: 1rem;
  }

  .summary-box-visualization {
    grid-row: 1;
    grid-column: 1;
  }

  .summary-box-product-information {
    grid-row: 2;
    grid-column: 1;
  }

  .summary-box-citation {
    grid-row: 3;
    grid-column: 1;
  }
}
</style>
