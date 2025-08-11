<template>
  <div class="filterbox">
    <span class="filterlabel">Date</span>
    <div class="quickselectors">
      <button
        id="yearBtn"
        class="quickBtn"
        @click="setDateRangeForCurrentYear()"
        :class="{ activeBtn: activeBtn === 'btn1' }"
      >
        Current year
      </button>
      <button id="monthBtn" class="quickBtn" @click="setDateRange(30)" :class="{ activeBtn: activeBtn === 'btn2' }">
        Last 30 days
      </button>
      <button id="weekBtn" class="quickBtn" @click="setDateRange(0)" :class="{ activeBtn: activeBtn === 'btn3' }">
        Today
      </button>
    </div>

    <div class="date" v-if="showDateRange">
      <DatePicker
        name="dateFrom"
        v-model="dateFrom"
        :start="beginningOfHistory"
        :end="dateTo"
        @error="dateFromError = $event"
        :key="dateFromUpdate"
      />
      <span class="centerlabel">&#8212;</span>
      <DatePicker
        name="dateTo"
        v-model="dateTo"
        :start="showDateRange ? dateFrom : beginningOfHistory"
        :end="today"
        @error="dateToError = $event"
        :key="dateToUpdate"
      />
      <div v-if="!isTrueOnBothDateFields('isValidDateString')" class="errormsg">
        Invalid input. Insert date in the format <i>yyyy-mm-dd</i>.
      </div>
      <template v-else>
        <div v-if="!isTrueOnBothDateFields('isNotInFuture')" class="errormsg">Provided date is in the future.</div>
        <div
          v-if="(dateFromError && !dateFromError.isBeforeEnd) || (dateToError && !dateToError.isAfterStart)"
          class="errormsg"
        >
          Start date must be before end date.
        </div>
      </template>
    </div>

    <div class="date" v-else>
      <DatePicker
        name="dateTo"
        v-model="dateTo"
        :start="beginningOfHistory"
        :end="today"
        @error="dateToError = $event"
        :key="vizDateUpdate"
      />
      <div class="dateButtons">
        <BaseButton type="secondary" id="previousBtn" @click="setPreviousDate()" :disabled="!hasPreviousDate()">
          &larr;
        </BaseButton>
        <BaseButton
          type="secondary"
          id="nextBtn"
          @click="setNextDate()"
          :disabled="!hasNextDate()"
          style="margin-left: 0.5rem"
        >
          &rarr;
        </BaseButton>
      </div>
      <div v-if="dateToError && !dateToError.isValidDateString" class="errormsg">
        Invalid input. Insert date in the format <i>yyyy-mm-dd</i>.
      </div>
      <div v-if="dateToError && dateToError.isValidDateString && !dateToError.isNotInFuture" class="errormsg">
        Provided date is in the future.
      </div>
    </div>
    <CheckBox id="showDateRangeCheckbox" class="checkbox" v-model="showDateRange" label="Show date range" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import DatePicker, { type DateErrors } from "@/components/DatePicker.vue";
import CheckBox from "@/components/CheckBox.vue";
import BaseButton from "@/components/BaseButton.vue";
import { dateToString, getDateFromBeginningOfYear, isSameDay } from "@/lib";
import { useRouteQuery, queryString } from "@/lib/useRouteQuery";

// dates
const beginningOfHistory = ref("1970-01-01");
const today = ref(dateToString(new Date()));
const dateFrom = useRouteQuery({ name: "dateFrom", defaultValue: today.value, type: queryString });
const dateFromError = ref<DateErrors>();
const dateTo = useRouteQuery({ name: "dateTo", defaultValue: today.value, type: queryString });
const dateToError = ref<DateErrors>();
const showDateRange = ref(false);

// keys
const dateFromUpdate = ref(10000);
const dateToUpdate = ref(20000);
const vizDateUpdate = ref(30000);

onMounted(async () => {
  window.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
});

function onKeyDown(event: KeyboardEvent) {
  if (!document.activeElement || document.activeElement.tagName != "INPUT") {
    if (event.code == "ArrowLeft") setPreviousDate();
    else if (event.code == "ArrowRight") setNextDate();
  }
}

function isTrueOnBothDateFields(errorId: keyof DateErrors) {
  if (!showDateRange.value) {
    return dateToError.value && dateToError.value[errorId];
  }
  return dateFromError.value && dateToError.value && dateFromError.value[errorId] && dateToError.value[errorId];
}

function setDateRange(n: number) {
  dateTo.value = dateToString(new Date());
  const date = new Date();
  date.setDate(date.getDate() - n);
  dateFrom.value = dateToString(date);
  showDateRange.value = n != 0;
}

function setDateRangeForCurrentYear() {
  dateTo.value = dateToString(new Date());
  dateFrom.value = dateToString(getDateFromBeginningOfYear());
  showDateRange.value = true;
}

function hasNextDate() {
  return !isSameDay(new Date(dateTo.value), new Date());
}

function hasPreviousDate() {
  return !isSameDay(new Date(dateTo.value), new Date(beginningOfHistory.value));
}

function setPreviousDate() {
  if (!showDateRange.value && hasPreviousDate()) {
    const date = new Date(dateTo.value);
    date.setUTCDate(date.getUTCDate() - 1);
    dateTo.value = dateFrom.value = dateToString(date);
  }
}

function setNextDate() {
  if (!showDateRange.value && hasNextDate()) {
    const date = new Date(dateTo.value);
    date.setUTCDate(date.getUTCDate() + 1);
    dateTo.value = dateFrom.value = dateToString(date);
  }
}

const activeBtn = computed(() => {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(
    Math.abs((new Date(dateTo.value).valueOf() - new Date(dateFrom.value).valueOf()) / oneDay),
  );
  const isDateToToday = isSameDay(new Date(dateTo.value), new Date());
  const isDateFromBeginningOfYear = isSameDay(new Date(dateFrom.value), getDateFromBeginningOfYear());
  if (isDateToToday && isDateFromBeginningOfYear) return "btn1";
  else if (isDateToToday && diffDays === 30) return "btn2";
  else if (isDateToToday && diffDays === 0) return "btn3";
  else return "";
});

watch(
  () => dateTo.value,
  (newValue) => {
    if (!showDateRange.value) {
      dateFrom.value = newValue;
    }
  },
);

watch(
  () => showDateRange.value,
  (enabled) => {
    if (!enabled) {
      dateFrom.value = dateTo.value;
    }
  },
);
</script>
