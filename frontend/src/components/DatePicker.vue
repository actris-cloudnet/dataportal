<style scoped lang="sass">
.dateform
  overflow: hidden
  white-space: nowrap

.container
  display: flex
  height: 2em

input.date
  box-sizing: content-box
  width: 6.3em
  font-size: 0.9em
  border: 1px solid #e8e8e8
  border-right: none
  border-radius: 2px 0 0 2px
</style>

<template>
  <div class="dateform" :id="name" :class="{ error: hasError }">
    <label v-if="label" :for="name">{{ label }}</label>
    <br v-if="label" />
    <div class="container">
      <input
        class="date"
        :name="name"
        type="text"
        v-model.lazy="dateString"
        @focus="($event.target as HTMLInputElement).select()"
      />
      <v-date-picker
        locale="en-gb"
        v-model="dateValue"
        :popover="{ placement: 'bottom' }"
        :input-debounce="100"
        :min-date="start"
        :max-date="end"
        :is-required="true"
      >
        <template v-slot="{ togglePopover }">
          <button class="calendar" @click="togglePopover">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              class="w-4 h-4 fill-current"
            >
              <!-- eslint-disable-next-line max-len -->
              <path
                d="M1 4c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zm2 2v12h14V6H3zm2-6h2v2H5V0zm8 0h2v2h-2V0zM5 9h2v2H5V9zm0 4h2v2H5v-2zm4-4h2v2H9V9zm0 4h2v2H9v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z"
              />
            </svg>
          </button>
        </template>
      </v-date-picker>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watchEffect, ref } from "vue";
import { dateToString, dateToUTC } from "@/lib";
import { DatePicker as VDatePicker } from "v-calendar";
import "v-calendar/dist/style.css";

export interface Props {
  modelValue: Date;
  name: string;
  label?: string;
  start: Date;
  end: Date;
}

export interface DateErrors {
  isValidDateString: boolean;
  isNotInFuture: boolean;
  isBeforeEnd: boolean;
  isAfterStart: boolean;
}

const props = defineProps<Props>();

const hasError = ref(false);

const emit = defineEmits<{
  (e: "update:modelValue", value: Props["modelValue"]): void;
  (e: "error", error: DateErrors): void;
}>();

function truncateDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function validateDate(value: Date) {
  const result = {
    isValidDateString: !isNaN(value.getDate()),
    isNotInFuture: truncateDate(value) <= truncateDate(dateToUTC(new Date())),
    isBeforeEnd: truncateDate(value) <= truncateDate(props.end),
    isAfterStart: truncateDate(value) >= truncateDate(props.start),
  };
  hasError.value =
    !result.isValidDateString ||
    !result.isNotInFuture ||
    !result.isAfterStart ||
    !result.isBeforeEnd;
  emit("error", result);
  return result;
}

watchEffect(() => {
  validateDate(props.modelValue);
});

const dateValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  },
});

const dateString = computed({
  get() {
    return dateToString(props.modelValue);
  },
  set(value) {
    const date = new Date(value);
    if (validateDate(date).isValidDateString) {
      emit("update:modelValue", date);
    }
  },
});
</script>
