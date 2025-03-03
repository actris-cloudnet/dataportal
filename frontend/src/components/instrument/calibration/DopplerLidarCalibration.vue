<template>
  <div>
    <CalibrationTable
      :data="azimuthOffset"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Azimuth offsets', label: 'Azimuth offset (deg)' }"
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
    };
  }[];
}>();

const azimuthOffset = computed(() => props.calibrationData.map((entry) => entry.data.azimuth_offset ?? null));
</script>
