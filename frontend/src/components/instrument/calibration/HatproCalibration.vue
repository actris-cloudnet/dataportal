<template>
  <div>
    <CalibrationPlot v-if="lwpOffset?.length" :data="lwpOffset" :config="{ title: 'LWP offset', ylabel: 'g m-2' }" />
    <CalibrationTable
      :data="calibrationData.coefficientLinks"
      :config="{ title: 'Retrieval coefficients', label: 'Coefficient files' }"
    />
    <CalibrationTable :data="calibrationData.scan_time" :config="{ title: 'Scan times', label: 'Scan time (s)' }" />
  </div>
</template>

<script lang="ts" setup>
import type { CalibrationList } from "@shared/entity/Calibration";
import CalibrationTable from "@/components/instrument/calibration/CalibrationTable.vue";
import CalibrationPlot from "@/components/instrument/calibration/CalibrationPlot.vue";
import { computed } from "vue";

const props = defineProps<{
  calibrationData: CalibrationList;
}>();

const lwpOffset = computed(
  () =>
    props.calibrationData.lwpOffset?.flatMap((entry) => [
      { ...entry, data: entry.data[0] * 1000 },
      { ...entry, measurementDate: entry.measurementDate + "T12:00:00Z", data: entry.data[1] * 1000 },
    ]),
);
</script>
