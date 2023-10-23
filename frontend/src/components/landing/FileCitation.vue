<script lang="ts" setup>
import HowToCite from "@/components/HowToCite.vue";
import BaseAlert from "@/components/BaseAlert.vue";
import type { FileResponse } from "@/views/FileView.vue";

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
  </div>
</template>
