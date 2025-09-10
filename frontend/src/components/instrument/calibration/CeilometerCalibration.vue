<template>
  <div>
    <CalibrationTable
      v-if="calibrationData.calibration_factor?.length <= showPlotThreshold"
      :data="calibrationData.calibration_factor"
      :config="{ title: 'Calibration factor', label: 'Calibration factor' }"
    />
    <CalibrationPlot
      v-if="calibrationData.calibration_factor?.length > showPlotThreshold"
      :data="calibrationData.calibration_factor"
      :config="{ title: 'Calibration factor' }"
    />
    <CalibrationTable
      v-if="calibrationData.range_corrected?.length <= showPlotThreshold"
      :data="calibrationData.range_corrected"
      :config="{ title: 'Range correction', label: 'Range corrected' }"
    />
    <CalibrationPlot
      v-if="calibrationData.range_corrected?.length > showPlotThreshold"
      :data="calibrationData.range_corrected"
      :config="{ title: 'Range correction' }"
    />
    <CalibrationTable :data="calibrationData.snr_limit" :config="{ title: 'SNR limit', label: 'SNR limit' }" />
    <CalibrationTable
      :data="calibrationData.time_offset"
      :config="{ title: 'Time offset', label: 'Time offset (min)' }"
    />
  </div>
</template>

<script lang="ts" setup>
import type { CalibrationList } from "@shared/entity/Calibration";
import CalibrationTable from "@/components/instrument/calibration/CalibrationTable.vue";
import CalibrationPlot from "@/components/instrument/calibration/CalibrationPlot.vue";

defineProps<{
  calibrationData: CalibrationList;
}>();

const showPlotThreshold = 100;
</script>
