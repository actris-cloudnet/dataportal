<template>
  <div>
    <CalibrationTable
      v-if="nValidValues(calibrationData.calibration_factor) <= showPlotThreshold"
      :data="calibrationData.calibration_factor"
      :config="{ title: 'Calibration factor', label: 'Calibration factor' }"
    />
    <CalibrationPlot
      v-if="nValidValues(calibrationData.calibration_factor) > showPlotThreshold"
      :data="calibrationData.calibration_factor"
      :config="{ title: 'Calibration factor', label: 'Calibration factor' }"
    />
    <CalibrationTable
      v-if="nValidValues(calibrationData.range_corrected) <= showPlotThreshold"
      :data="calibrationData.range_corrected"
      :config="{ title: 'Range correction', label: 'Range corrected' }"
    />
    <CalibrationPlot
      v-if="nValidValues(calibrationData.range_corrected) > showPlotThreshold"
      :data="calibrationData.range_corrected"
      :config="{ title: 'Range correction', label: 'Range corrected' }"
    />
    <CalibrationTable :data="calibrationData.snr_limit" :config="{ title: 'SNR limit', label: 'SNR limit' }" />
    <CalibrationTable
      :data="calibrationData.time_offset"
      :config="{ title: 'Time offset', label: 'Time offset (min)' }"
    />
  </div>
</template>

<script lang="ts" setup>
import CalibrationTable from "@/components/instrument/calibration/CalibrationTable.vue";
import CalibrationPlot from "@/components/instrument/calibration/CalibrationPlot.vue";
import { nValidValues } from "@/lib";

defineProps<{
  calibrationData: any;
}>();

const showPlotThreshold = 100;
</script>
