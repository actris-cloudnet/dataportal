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
  </div>
</template>

<script setup lang="ts">
const periods = ["all", "year", "month", "week", "day"];
const selectedPeriod = defineModel<string>("period", { default: "month" });
function onClick(period: string) {
  selectedPeriod.value = period;
}
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";
.periods {
  display: flex;
}
button {
  margin: 2px;
  cursor: pointer;
  border: 1px solid rgba(27, 31, 35, 0.15);
  border-radius: 6px;
  padding: 4px 16px;
}
button.active {
  border-color: black;
}
button:hover {
  background-color: black;
  color: white;

}
</style>
