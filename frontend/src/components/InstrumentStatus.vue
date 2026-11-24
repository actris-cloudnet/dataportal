<template>
  <span
    :class="['status', status]"
    role="img"
    :title="instrumentStatusLabels[status]"
    :aria-label="instrumentStatusLabels[status]"
  ></span>
</template>

<script lang="ts" setup>
import type { InstrumentStatus } from "@shared/entity/Instrument";
import { instrumentStatusLabels } from "@/lib";

defineProps<{ status: InstrumentStatus }>();
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
