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
  <div class="dateform" :id="name">
    <label v-if="label" :for="name">{{ label }}</label
    ><br v-if="label" />
    <div class="container">
      <input class="date" :name="name" type="text" v-model.lazy="dateString" @focus="$event.target.select()" />
      <v-date-picker
        locale="en-gb"
        :value="value"
        @input="(newValue) => emit('input', newValue)"
        :popover="{ placement: 'bottom', visibility: 'click' }"
        :input-debounce="100"
        :available-dates="{ start, end }"
      >
        <button class="calendar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-4 h-4 fill-current">
            <!-- eslint-disable-next-line max-len -->
            <path
              d="M1 4c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zm2 2v12h14V6H3zm2-6h2v2H5V0zm8 0h2v2h-2V0zM5 9h2v2H5V9zm0 4h2v2H5v-2zm4-4h2v2H9V9zm0 4h2v2H9v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z"
            />
          </svg>
        </button>
      </v-date-picker>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watchEffect } from "vue";
import { dateToString, dateToUTC } from "../lib";
import VDatePicker from "v-calendar/lib/components/date-picker.umd";

interface Props {
  value: Date;
  name: string;
  label: string;
  start: Date;
  end: Date;
}

const props = defineProps<Props>();

const emit = defineEmits(["input", "error"]);

function validateDate(value: Date) {
  const result = {
    isValidDateString: !isNaN(value.getDate()),
    isNotInFuture: value < dateToUTC(new Date()),
    isBeforeEnd: value <= props.end,
    isAfterStart: value >= props.start,
  };
  emit("error", result);
  return result;
}

watchEffect(() => {
  validateDate(props.value);
});

const dateString = computed({
  get: () => dateToString(props.value),
  set(newValue) {
    const date = new Date(newValue);
    if (validateDate(date).isValidDateString) {
      emit("input", date);
    }
  },
});
</script>
