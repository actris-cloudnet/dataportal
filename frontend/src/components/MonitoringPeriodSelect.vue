<template>
  <div class="periodselect">
    <label>Period</label>
    <div class="periods">
      <button
        v-for="period in periods"
        :key="period"
        @click="onClick(period)"
        :class="{ active: selectedPeriod === period }"
      >
        {{ period }}
      </button>
    </div>
    <MonitoringDateSelect
      v-if="availablePeriods"
      v-model:selectedDate="startDate"
      :availablePeriods="availablePeriods"
      :selectedPeriod="selectedPeriod"
    />
  </div>
</template>

<script setup lang="ts">
import { useMonitoringPeriods } from "@/composables/useMonitoringPeriods";
import MonitoringDateSelect from "./MonitoringDateSelect.vue";

const periods = ["all", "year", "month", "week", "day"];
const selectedPeriod = defineModel<string>("period", { default: "month" });
const startDate = defineModel<string | undefined>("startDate", { default: undefined });
function onClick(period: string) {
  selectedPeriod.value = period;
}

const { results: availablePeriods } = useMonitoringPeriods();
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss" as vars;
.periods {
  display: flex;
  width: 100%;
  max-width: 300px;
  justify-content: space-between;
  margin-bottom: 1rem;
}
button {
  margin: 2px;
  cursor: pointer;
  border: 1px solid vars.$gray1;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 14px;
  color: vars.$gray5;
}
button.active {
  border-color: vars.$gray5;
}
button:hover {
  background-color: #f2f2f2;
}
</style>
