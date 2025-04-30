<template>
  <div>
    <CalibrationTable
      :data="calibrationData.azimuth_offset"
      :config="{ title: 'Azimuth offset', label: 'Azimuth offset (deg)' }"
    />
    <CalibrationTable
      :data="calibrationData.time_offset"
      :config="{ title: 'Time offset', label: 'Time offset (min)' }"
    />
  </div>
</template>

<script lang="ts" setup>
import type { CalibrationList } from "@shared/entity/Calibration";
import CalibrationTable from "@/components/instrument/calibration/CalibrationTable.vue";

defineProps<{
  calibrationData: CalibrationList;
}>();
</script>
