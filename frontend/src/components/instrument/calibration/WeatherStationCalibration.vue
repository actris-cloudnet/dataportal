<template>
  <div>
    <CalibrationTable :data="calibrationData.time_offset" :config="{ title: 'Time offset', label: 'Offset (min)' }" />
  </div>
</template>

<script lang="ts" setup>
import CalibrationTable from "@/components/instrument/calibration/CalibrationTable.vue";

defineProps<{
  calibrationData: any;
}>();
</script>
