<template>
  <div>
    <CalibrationTable
      :data="calibrationData.coefficientLinks"
      :config="{ title: 'Retrieval coefficients', label: 'Coefficient files' }"
    />
    <CalibrationTable :data="calibrationData.scan_time" :config="{ title: 'Scan times', label: 'Scan time (s)' }" />
  </div>
</template>

<script lang="ts" setup>
import type { CalibrationList } from "@shared/entity/Calibration";
import CalibrationTable from "@/components/instrument/calibration/CalibrationTable.vue";

defineProps<{
  calibrationData: CalibrationList;
}>();
</script>
