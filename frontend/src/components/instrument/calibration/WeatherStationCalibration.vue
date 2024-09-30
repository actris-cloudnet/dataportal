<template>
  <div>
    <CalibrationTable
      :data="timeOffset"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Time offset', label: 'Offset (min)' }"
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
      time_offset?: string[];
    };
  }[];
}>();

const timeOffset = computed(() => props.calibrationData.map((entry) => entry.data.time_offset ?? null));
</script>
