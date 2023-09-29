<script lang="ts" setup>
import warningIcon from "@/assets/icons/test-warning-mono.svg";
import HowToCite from "../HowToCite.vue";
import type { FileResponse } from "@/views/FileView.vue";

export interface Props {
  file: FileResponse;
}

defineProps<Props>();
</script>

<template>
  <div class="summary-section" id="citation">
    <div v-if="file.volatile" class="disclaimer-banner" :class="'volatile-banner'">
      <img class="banner-icon" alt="warning icon" :src="warningIcon" />
      <span v-if="file.volatile">This data object is volatile and may be updated in the future.</span>
    </div>
    <div v-if="file.legacy" class="disclaimer-banner" :class="'legacy-banner'">
      <img class="banner-icon" alt="warning icon" :src="warningIcon" />
      <span v-if="file.legacy">This data object was produced using nonstandard processing.</span>
    </div>
    <HowToCite :uuid="file.uuid" />
  </div>
</template>

<style scoped lang="scss">
@import "@/sass/landing-beta.sass";

.citation-note {
  padding-left: calc($basespacing/2);
  padding-right: calc($basespacing/2);
}

.disclaimer-banner {
  display: flex;
  align-items: center;
  border-radius: $baseradius;
  font-weight: 400;
  font-size: 90%;
  padding: 0.5 * $basespacing $basespacing;
  margin-bottom: 0.7em;

  .banner-icon {
    height: 1rem;
    padding-right: 0.5 * $basespacing;
    opacity: 0.4;
  }
}

.volatile-banner {
  background-color: rgba($BLUE-3-rgb, 0.4);
}

.legacy-banner {
  background-color: rgba($GRAY-3-hex, 0.4);
}
</style>
