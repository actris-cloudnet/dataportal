<template>
  <div>
    <CalibrationTable
      :data="coefficients"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Retrieval coefficients', label: 'Coefficient files' }"
    />
    <CalibrationTable
      :data="scanTime"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Scan times', label: 'Scan time (s)' }"
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
      coefficientLinks?: string[];
      scan_time?: number;
    };
  }[];
}>();

const coefficients = computed(() => props.calibrationData.map((entry) => entry.data.coefficientLinks ?? null));
const scanTime = computed(() => props.calibrationData.map((entry) => entry.data.scan_time ?? null));
</script>
