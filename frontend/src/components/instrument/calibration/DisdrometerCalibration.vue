<template>
  <div>
    <CalibrationTable
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :data="telegramChanged"
      :config="{ title: 'Telegram change', label: 'Telegram changed' }"
    />
    <CalibrationTable
      v-if="missingTimestampsExist"
      :measurementDates="measurementDates"
      :timestamps="timestamps"
      :data="missingTimestamps"
      :config="{ title: 'Missing timestamps', label: 'Timestamps missing from raw data' }"
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
      telegram?: boolean;
      missing_timestamps?: boolean;
    };
  }[];
}>();

const telegramChanged = computed(() => props.calibrationData.map((entry) => (entry.data.telegram ? true : false)));

const missingTimestamps = computed(() =>
  props.calibrationData.map((entry) => (entry.data.missing_timestamps ? true : false)),
);

const missingTimestampsExist = computed(() => missingTimestamps.value.some((value) => value === true));
</script>
