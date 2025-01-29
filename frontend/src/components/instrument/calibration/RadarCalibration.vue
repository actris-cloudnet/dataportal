<template>
  <div>
    <CalibrationTable
      :data="rangeOffset"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Range offset', label: 'Offset (m)' }"
    />
    <CalibrationTable
      :data="azimuthOffsets"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Azimuth offset', label: 'Azimuth offset (deg)' }"
    />
    <CalibrationTable
      :data="zenithOffsets"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Zenith offset', label: 'Zenith offset (deg)' }"
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
      range_offset?: number;
      azimuth_offset?: number;
      zenith_offset?: number;
    };
  }[];
}>();

const rangeOffset = computed(() => props.calibrationData.map((entry) => entry.data.range_offset ?? null));
const azimuthOffsets = computed(() => props.calibrationData.map((entry) => entry.data.azimuth_offset ?? null));
const zenithOffsets = computed(() => props.calibrationData.map((entry) => entry.data.zenith_offset ?? null));
</script>
