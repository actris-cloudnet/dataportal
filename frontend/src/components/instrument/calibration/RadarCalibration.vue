<template>
  <div>
    <CalibrationTable :data="calibrationData.range_offset" :config="{ title: 'Range offset', label: 'Offset (m)' }" />
    <CalibrationTable
      :data="calibrationData.azimuth_offset"
      :config="{ title: 'Azimuth offset', label: 'Azimuth offset (deg)' }"
    />
    <CalibrationTable
      :data="calibrationData.zenith_offset"
      :config="{ title: 'Zenith offset', label: 'Zenith offset (deg)' }"
    />
    <CalibrationTable :data="calibrationData.snr_limit" :config="{ title: 'SNR limit', label: 'SNR limit' }" />
  </div>
</template>

<script lang="ts" setup>
import CalibrationTable from "@/components/instrument/calibration/CalibrationTable.vue";

defineProps<{
  calibrationData: any;
}>();
</script>
