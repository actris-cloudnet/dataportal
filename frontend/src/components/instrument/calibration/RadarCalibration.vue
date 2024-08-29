<template>
  <div>
    <CalibrationTable
      :data="rangeOffset"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :config="{ title: 'Range offset', label: 'Offset (m)' }"
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
      range_offset?: string[];
    };
  }[];
}>();

const rangeOffset = computed(() => props.calibrationData.map((entry) => entry.data.range_offset ?? null));
</script>
