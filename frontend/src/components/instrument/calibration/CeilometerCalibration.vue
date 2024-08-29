<template>
  <div>
    <div v-if="plotError" class="error-message">{{ plotError }}</div>
    <div v-else>
      <CalibrationPlot
        v-if="typedCalibrationFactorData"
        class="calibration-plot"
        :data="typedCalibrationFactorData"
        :config="calibrationFactorConfig"
      />
      <CalibrationPlot
        v-if="typedRangeCorrectedData"
        class="calibration-plot"
        :data="typedRangeCorrectedData"
        :config="rangeCorrectedConfig"
      />
      <div v-if="!typedCalibrationFactorData && !typedRangeCorrectedData" class="error-message">
        No valid plot data available.
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watchEffect } from "vue";
import type { InstrumentInfo } from "@shared/entity/Instrument";
import CalibrationPlot from "@/components/instrument/calibration/CalibrationPlot.vue";

interface CalibrationDataEntry {
  createdAt: string;
  updatedAt: string;
  measurementDate: string;
  data: {
    range_corrected: boolean;
    calibration_factor: number;
  };
}

export interface Props {
  instrumentInfo: InstrumentInfo;
  calibrationData: CalibrationDataEntry[];
}

const props = defineProps<Props>();

const calibrationFactorConfig = ref({
  title: "Calibration factor",
  label: "Calibration factor",
  color: "#5F95DC",
});

const rangeCorrectedConfig = ref({
  title: "Range Corrected",
  label: "Range Corrected",
  color: "#FF6347",
});

const plotError = ref<string | null>(null);

const plotData = computed(() => {
  const measurementDates = props.calibrationData.map((entry) =>
    Math.floor(new Date(entry.measurementDate).getTime() / 1000),
  );
  const calibrationFactor = props.calibrationData.map((entry) => entry.data.calibration_factor);
  const rangeCorrected = props.calibrationData.map((entry) => (entry.data.range_corrected ? 1 : 0));

  if (measurementDates.length === 0 || calibrationFactor.length === 0 || rangeCorrected.length === 0) {
    return null;
  }

  return { measurementDates, calibrationFactor, rangeCorrected };
});

const typedCalibrationFactorData = computed(() => {
  const data = plotData.value;
  return data ? [new Float64Array(data.measurementDates), new Float64Array(data.calibrationFactor)] : null;
});

const typedRangeCorrectedData = computed(() => {
  const data = plotData.value;
  return data ? [new Float64Array(data.measurementDates), new Uint8Array(data.rangeCorrected)] : null;
});

watchEffect(() => {
  if (plotData.value === null) {
    plotError.value = "No valid plot data available";
  } else {
    plotError.value = null;
  }
});

onMounted(async () => {});
</script>

<style scoped>
.calibration-plot:not(:last-child) {
  margin-bottom: 20px;
}
</style>
