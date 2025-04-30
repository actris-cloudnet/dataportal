<template>
  <div>
    <CalibrationTable :data="telegramChanged" :config="{ title: 'Telegram', label: 'Telegram' }" />
    <CalibrationTable
      :data="calibrationData.missing_timestamps"
      :config="{ title: 'Missing timestamps', label: 'Timestamps missing from raw data' }"
    />
  </div>
</template>

<script lang="ts" setup>
import type { CalibrationList } from "@shared/entity/Calibration";
import CalibrationTable from "@/components/instrument/calibration/CalibrationTable.vue";
import { computed } from "vue";

const props = defineProps<{
  calibrationData: CalibrationList;
}>();

const telegramChanged = computed(
  () => props.calibrationData.telegram?.map((entry: any) => ({ ...entry, data: entry.data.join(", ") })),
);
</script>
