<script setup lang="ts">
import type { FileResponse } from "@/views/FileView.vue";
import BaseTag, { type TagSize } from "./BaseTag.vue";
import type { VisualizationResponse } from "@shared/entity/VisualizationResponse";

interface Props {
  response: FileResponse | VisualizationResponse;
  size?: TagSize;
}

withDefaults(defineProps<Props>(), { size: "normal" });
</script>

<template>
  <span class="tags">
    <BaseTag
      v-if="'site' in response && response.site.actrisId"
      type="actris"
      :size="size"
      title="Data from ACTRIS site"
    >
      ACTRIS
    </BaseTag>
    <BaseTag v-if="'site' in response && response.site.type.includes('ri-urbans')" type="ri-urbans">
      RI-URBANS
    </BaseTag>
    <BaseTag v-if="response.volatile" type="volatile" :size="size" title="Data may change in future">
      Volatile
    </BaseTag>
    <BaseTag v-if="response.legacy" type="legacy" :size="size" title="Produced using non-standardized processing">
      Legacy
    </BaseTag>
    <BaseTag
      v-if="'experimental' in response ? response.experimental : response.product.experimental"
      type="experimental"
      :size="size"
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
