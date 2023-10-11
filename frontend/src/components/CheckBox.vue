<script lang="ts">
let idCounter = 0;
</script>

<script lang="ts" setup>
export interface Props {
  modelValue: boolean;
  label: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: Props["modelValue"]): void;
}>();

const id = `checkbox-${idCounter++}`;
</script>

<template>
  <div class="wrapper">
    <input
      :id="id"
      type="checkbox"
      :checked="props.modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <label :for="id">{{ props.label }}</label>
  </div>
</template>

<style lang="scss" scoped>
@import "@/sass/variables.scss";

.wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

input {
  position: relative;
  width: 1rem;
  height: 1rem;
  color: black;
  border: 2px solid gray;
  border-radius: 3px;

  &::before {
    position: absolute;
    content: "";
    top: 0px;
    left: 3px;
    width: 6px;
    height: 10px;
    border-style: solid;
    border-color: white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    opacity: 0;
  }

  &:checked {
    color: white;
    border-color: $actris-green;
    background: $actris-green;

    &::before {
      opacity: 1;
    }
  }
}

label {
  cursor: default;
  font-size: 90%;
}
</style>
