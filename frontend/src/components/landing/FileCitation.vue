<script lang="ts" setup>
import HowToCite from "@/components/HowToCite.vue";
import BaseAlert from "@/components/BaseAlert.vue";
import type { FileResponse } from "@/views/FileView.vue";
import ccIcon from "@/assets/icons/cc.svg";
import byIcon from "@/assets/icons/by.svg";

export interface Props {
  file: FileResponse;
}

defineProps<Props>();
</script>

<template>
  <div class="summary-section" id="citation">
    <BaseAlert type="note" v-if="file.volatile">
      This data object is volatile and may be updated in the future.
    </BaseAlert>
    <BaseAlert type="info" v-if="file.legacy">This data object was produced using nonstandard processing.</BaseAlert>
    <HowToCite :uuid="file.uuid" titleClass="summary-section-header" />
    <p xmlns:cc="http://creativecommons.org/ns#" class="license">
      ACTRIS Cloudnet data is licensed under
      <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">
        CC BY 4.0
        <img :src="ccIcon" /><img :src="byIcon" />
      </a>
    </p>
  </div>
</template>

<style scoped lang="scss">
.license {
  margin-top: 1rem;

  img {
    height: 22px;
    margin-left: 3px;
    vertical-align: text-bottom;
  }
}
</style>
