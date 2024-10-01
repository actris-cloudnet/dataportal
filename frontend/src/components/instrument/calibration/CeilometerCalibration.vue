<template>
  <div>
    <CalibrationTable
      v-if="nValidValues(calibrationFactor) <= showPlotThreshold"
      :data="calibrationFactor"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Calibration factor', label: 'Calibration factor' }"
    />
    <CalibrationPlot
      v-if="nValidValues(calibrationFactor) > showPlotThreshold"
      :data="calibrationFactor"
      :measurementDates="measurementDates"
      :config="{ title: 'Calibration factor', label: 'Calibration factor' }"
    />
    <CalibrationTable
      v-if="nValidValues(isRangeCorrected) <= showPlotThreshold"
      :data="isRangeCorrected"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Range correction', label: 'Range corrected' }"
    />
    <CalibrationPlot
      v-if="nValidValues(isRangeCorrectedNumber) > showPlotThreshold"
      :data="isRangeCorrectedNumber"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Range correction', label: 'Range corrected' }"
    />
    <CalibrationTable
      :data="snrLimit"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'SNR limit', label: 'SNR limit' }"
    />
    <CalibrationTable
      :data="timeOffset"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Time offset', label: 'Time offset (min)' }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import CalibrationTable from "@/components/instrument/calibration/CalibrationTable.vue";
import CalibrationPlot from "@/components/instrument/calibration/CalibrationPlot.vue";
import { nValidValues } from "@/lib";

const props = defineProps<{
  measurementDates: string[];
  timestamps: string[];
  calibrationData: {
    data: {
      calibration_factor?: number;
      range_corrected?: boolean;
      snr_limit?: number;
      time_offset?: number;
    };
  }[];
}>();

const showPlotThreshold = 100;

const calibrationFactor = computed(() => props.calibrationData.map((entry) => entry.data.calibration_factor ?? null));
const isRangeCorrected = computed(() => props.calibrationData.map((entry) => entry.data.range_corrected ?? null));
const snrLimit = computed(() => props.calibrationData.map((entry) => entry.data.snr_limit ?? null));
const isRangeCorrectedNumber = computed(() => isRangeCorrected.value.map((value) => (value ? 1.0 : 0.0)));
const timeOffset = computed(() => props.calibrationData.map((entry) => entry.data.time_offset ?? null));
</script>
