<script setup lang="ts">
import type { FileResponse } from "@/views/FileView.vue";
import BaseTag, { type TagSize } from "./BaseTag.vue";
import type { VisualizationResponse } from "@shared/entity/VisualizationResponse";

interface Props {
  response: FileResponse | VisualizationResponse;
  size?: TagSize;
}

withDefaults(defineProps<Props>(), { size: "normal" });

const getDvasLink = (dvasId: number) => {
  return `https://dev-dc.actris.nilu.no/${dvasId.toString()}`;
};
</script>

<template>
  <span class="tags">
    <BaseTag
      v-if="'site' in response && response.site.actrisId"
      type="actris"
      :size="size"
      title="Data from ACTRIS site"
    >
      ACTRIS site
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
    <template v-if="'dvasId' in response && response.dvasId !== null">
      <BaseTag type="dvas" :size="size" title="Data available from the main ACTRIS data portal">
        <a :href="getDvasLink(response.dvasId)" target="_blank" rel="noopener noreferrer" style="color: white"
          >ACTRIS data
          <svg class="dvas-link-icon" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
            <path
              d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"
            />
          </svg>
        </a>
      </BaseTag>
    </template>
  </span>
</template>

<style scoped lang="scss">
.tags {
  display: inline-flex;
  gap: 0.5rem;
}

.dvas-link-icon {
  height: 15px;
  width: 15px;
  vertical-align: bottom;
  margin-bottom: 0.15rem;
}
</style>
