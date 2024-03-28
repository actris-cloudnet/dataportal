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
        placeholder="YYYY-MM-DD"
      />
      <v-date-picker
        locale="en-gb"
        v-model="dateValue"
        timezone="UTC"
        :popover="{ placement: 'bottom' }"
        :input-debounce="100"
        :min-date="start"
        :max-date="end"
        :is-required="true"
      >
        <template v-slot="{ togglePopover }">
          <button class="calendar" @click="togglePopover">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-4 h-4 fill-current">
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
import { computed, watchEffect, ref, watch } from "vue";
import { dateToString } from "@/lib";
import { DatePicker as VDatePicker } from "v-calendar";
import "v-calendar/dist/style.css";

export interface Props {
  modelValue: string | null;
  name: string;
  label?: string;
  start?: string;
  end?: string;
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

function validateDate(value: string) {
  const result = {
    isValidDateString: !isNaN(new Date(value).getDate()),
    isNotInFuture: value <= dateToString(new Date()),
    isBeforeEnd: props.end ? value <= props.end : true,
    isAfterStart: props.start ? value >= props.start : true,
  };
  hasError.value = !result.isValidDateString || !result.isNotInFuture || !result.isAfterStart || !result.isBeforeEnd;
  emit("error", result);
  return result;
}

const dateString = ref("");

watchEffect(() => {
  if (props.modelValue) {
    validateDate(props.modelValue);
    dateString.value = props.modelValue;
  }
});

watch(
  () => dateString.value,
  (value) => {
    value = value.trim();
    if (value) {
      if (!validateDate(value).isValidDateString) return;
      emit("update:modelValue", dateToString(new Date(value)));
    } else {
      emit("update:modelValue", null);
    }
  },
);

const dateValue = computed({
  get() {
    return new Date(props.modelValue!);
  },
  set(value) {
    emit("update:modelValue", dateToString(value));
  },
});
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

.dateform {
  overflow: hidden;
  white-space: nowrap;
}

.container {
  display: flex;
  height: 2em;
}

input.date {
  box-sizing: content-box;
  width: 6.3em;
  font-size: 0.9em;
  border: 1px solid #e8e8e8;
  border-right: none;
  border-radius: 2px 0 0 2px;

  &::placeholder {
    font-size: 85%; // No condensed variant of Inter font
  }
}

button {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 2em;
  height: 100%;
  background-color: $blue-dust;
  color: white;
  border: 1px solid $steel-warrior;
  border-radius: 0 2px 2px 0;
  font-size: 1em;
  cursor: pointer;

  &:focus {
    background-color: $steel-warrior;
    outline: none;
  }

  &:hover {
    background-color: $steel-warrior;
  }

  &:active {
    background-color: $steel-warrior;
    border-color: $blue-dust;
  }

  & > svg {
    color: black;
    width: 1em;
    height: 1em;
  }
}
</style>
