<script setup lang="ts">
import type { FileResponse } from "@/views/FileView.vue";
import BaseTag from "./BaseTag.vue";
import type { VisualizationResponse } from "@shared/entity/VisualizationResponse";

interface Props {
  response: FileResponse | VisualizationResponse;
}

defineProps<Props>();
</script>

<template>
  <span class="tags">
    <BaseTag v-if="'site' in response && response.site.actrisId" type="actris" title="Data from ACTRIS site">
      ACTRIS
    </BaseTag>
    <BaseTag v-if="response.volatile" type="volatile" title="Data may change in future"> Volatile </BaseTag>
    <BaseTag v-if="response.legacy" type="legacy" title="Produced using non-standardized processing"> Legacy </BaseTag>
    <BaseTag
      v-if="'experimental' in response ? response.experimental : response.product.experimental"
      type="experimental"
      title="Experimental product"
    >
      Experimental
    </BaseTag>
  </span>
</template>

<style scoped lang="scss">
.tags {
  display: inline-flex;
  gap: 0.5rem;
}
</style>
