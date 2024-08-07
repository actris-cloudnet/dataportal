<template>
  <div>
    <div v-if="plotError" class="error-message">{{ plotError }}</div>
    <CalibrationPlot v-else-if="typedPlotData" :data="typedPlotData" :config="plotConfig" />
    <div v-else class="error-message">No valid plot data available.</div>
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
    azimuth_offset_deg: number;
  };
}

export interface Props {
  instrumentInfo: InstrumentInfo;
  calibrationData: CalibrationDataEntry[];
}

const props = defineProps<Props>();

const plotConfig = ref({
  title: "Azimuth offset",
  label: "Azimuth offset (deg)",
  color: "#5F95DC",
});

const plotError = ref<string | null>(null);

const plotData = computed(() => {
  if (!props.calibrationData) {
    return null;
  }

  const measurementDates = props.calibrationData.map((entry) =>
    Math.floor(new Date(entry.measurementDate).getTime() / 1000)
  );
  const azimuthOffsets = props.calibrationData.map((entry) => entry.data.azimuth_offset_deg);

  if (measurementDates.length === 0 || azimuthOffsets.length === 0) {
    return null;
  }

  return [measurementDates, azimuthOffsets];
});

watchEffect(() => {
  if (!props.calibrationData) {
    plotError.value = "Calibration data is null or undefined";
  } else if (plotData.value === null) {
    plotError.value = "No valid plot data available";
  } else {
    plotError.value = null;
  }
});

const typedPlotData = computed(() => {
  const data = plotData.value;
  return data ? data.map((arr) => new Float64Array(arr)) : null;
});

onMounted(async () => {});
</script>
