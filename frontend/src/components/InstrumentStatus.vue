<template>
  <span :class="['status', status]" :title="labels[status]"></span>
</template>

<script lang="ts" setup>
import type { InstrumentStatus } from "@shared/entity/Instrument";

defineProps<{ status: InstrumentStatus }>();

const labels: Record<InstrumentStatus, string> = {
  live: "Data within 3 hours",
  active: "Data within 3 days",
  recent: "Data within 7 days",
  inactive: "No recent data",
};
</script>

<style scoped lang="scss">
.status {
  display: inline-block;
  flex-shrink: 0;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  align-self: center;

  &.live {
    background: #25910f;
  }

  &.active {
    background: #93d383;
  }

  &.recent {
    background: #eed679;
  }

  &.inactive {
    background: #ddd;
  }
}
</style>
