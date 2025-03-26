<template>
  <div>
    <CalibrationTable
      :data="azimuthOffset"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Azimuth offsets', label: 'Azimuth offset (deg)' }"
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

const props = defineProps<{
  measurementDates: string[];
  timestamps: string[];
  calibrationData: {
    data: {
      azimuth_offset?: number;
      time_offset?: number;
    };
  }[];
}>();

const azimuthOffset = computed(() => props.calibrationData.map((entry) => entry.data.azimuth_offset ?? null));
const timeOffset = computed(() => props.calibrationData.map((entry) => entry.data.time_offset ?? null));
</script>
