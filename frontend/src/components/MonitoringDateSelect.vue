<template>
  <CustomMultiselect
    v-if="selectedPeriod == 'year'"
    id="start-date"
    label="Select Year"
    v-model="selectedDate"
    :options="yearOptions"
  />
  <CustomMultiselect
    v-if="selectedPeriod == 'month'"
    id="start-date"
    label="Select month"
    v-model="selectedDate"
    :options="monthOptions"
  />
  <CustomMultiselect
    v-if="selectedPeriod == 'week'"
    class="week"
    id="start-date"
    label="Select week"
    v-model="selectedDate"
    :options="weekOptions"
  />
  <div v-if="selectedPeriod !== 'all' && selectedPeriod !== 'day'" class="browse-buttons">
    <button class="browse prev" @click="setPreviousStartDate">&larr;</button>
    <button class="browse next" @click="setNextStartDate">&rarr;</button>
  </div>
  <div v-if="selectedPeriod == 'day'">
    <label>Select date</label>
    <div class="dateContainer">
      <DatePicker name="date" v-model="selectedDate" class="datepicker" />
      <div class="browse-buttons small">
        <button class="browse prev" @click="setPreviousStartDate">&larr;</button>
        <button class="browse next" @click="setNextStartDate">&rarr;</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DatePicker from "@/components/DatePicker.vue";
import type { AvailablePeriods } from "@/composables/useMonitoringPeriods";
import CustomMultiselect, { type Option } from "@/components/MultiSelect.vue";
import { computed, onMounted, onUnmounted, watch } from "vue";
import { bisectLeft, bisectRight, formatMonth, formatWeek, formatYear } from "@/lib/monitoringUtils";

const selectedDate = defineModel<string | null>("selectedDate", { default: null });
const props = defineProps<{
  availablePeriods: AvailablePeriods;
  selectedPeriod: string;
}>();

const daysAvailable = computed(() => {
  return [...(props.availablePeriods.day ?? [])].sort();
});
const weeksAvailable = computed(() => {
  return [...(props.availablePeriods.week ?? [])].sort();
});
const monthsAvailable = computed(() => {
  return [...(props.availablePeriods.month ?? [])].sort();
});
const yearsAvailable = computed(() => {
  return [...(props.availablePeriods.year ?? [])].sort();
});

const currentAvailable = computed(() => {
  switch (props.selectedPeriod) {
    case "day":
      return daysAvailable.value;
    case "week":
      return weeksAvailable.value;
    case "month":
      return monthsAvailable.value;
    case "year":
      return yearsAvailable.value;
    default:
      return [];
  }
});

onMounted(async () => {
  window.addEventListener("keydown", onKeyDown);
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
});

watch(
  () => [props.availablePeriods, props.selectedPeriod],
  () => {
    if (selectedDate.value === null && props.selectedPeriod !== "all") {
      if (
        props.selectedPeriod === "year" ||
        props.selectedPeriod === "month" ||
        props.selectedPeriod === "week" ||
        props.selectedPeriod === "day"
      ) {
        const options = props.availablePeriods[props.selectedPeriod];
        if (Array.isArray(options) && options.length > 0) {
          selectedDate.value = options[0];
        }
      }
    }
  },
  { immediate: true },
);

function onKeyDown(event: KeyboardEvent) {
  if (!document.activeElement || document.activeElement.tagName != "INPUT") {
    if (event.key == "ArrowLeft") setPreviousStartDate();
    else if (event.key == "ArrowRight") setNextStartDate();
  }
}


function setNextStartDate() {
  const options = currentAvailable.value;
  if (options.length == 0) {
    return;
  }
  const s = selectedDate.value;
  if (typeof s !== "string") {
    selectedDate.value = options[options.length - 1];
    return;
  }
  let i = bisectRight(options, s);
  i = Math.min(i, options.length - 1);
  selectedDate.value = options[i];
}
function setPreviousStartDate() {
  const options = currentAvailable.value;
  if (options.length == 0) {
    return;
  }
  const s = selectedDate.value;
  if (typeof s !== "string") {
    selectedDate.value = options[0];
    return;
  }
  let i = bisectLeft(options, s) - 1;
  i = Math.max(0, i);
  selectedDate.value = options[i];
}

const monthOptions = computed<Option[]>(() => {
  return (props.availablePeriods.month ?? []).map((d) => ({
    id: d,
    humanReadableName: formatMonth(d),
  }));
});
const yearOptions = computed<Option[]>(() => {
  return (props.availablePeriods.year ?? []).map((d) => ({
    id: d,
    humanReadableName: formatYear(d),
  }));
});

const weekOptions = computed<Option[]>(() => {
  return (props.availablePeriods.week ?? []).map((d) => ({
    id: d,
    humanReadableName: formatWeek(d, "short"),
  }));
});
</script>
<style scoped lang="scss">
@use "@/sass/variables.scss" as vars;
.datepicker {
}
.browse-buttons {
  width: 50%;
  margin-top: 0.2rem;
  display: flex;
  justify-content: space-between;
}
.browse-buttons.small {
  width: min-content;
  margin-left: 1rem;
}
button.browse:first-child {
  margin-right: 0.5rem;
}
button.browse {
  margin-top: 2px;
  cursor: pointer;
  border: 1px solid rgba(27, 31, 35, 0.15);
  border-radius: 6px;
  padding: 2px 20px;
  text-align: center;
  color: vars.$gray5;
  width: 50%;
  font-size: 14px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
button.browse:hover {
  background-color: #f2f2f2;
}
.dateContainer {
  display: flex;
  justify-content: flex-start;
}
</style>
