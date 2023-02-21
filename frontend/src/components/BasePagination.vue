<script lang="ts" setup>
import { computed } from "vue";

export interface Props {
  modelValue: number;
  totalRows: number;
  perPage: number;
  disabled: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: Props["modelValue"]): void;
}>();

const totalPages = computed(() => Math.ceil(props.totalRows / props.perPage));

const radius = 1;
const visiblePages = computed(() => {
  const middlePage = Math.min(
    Math.max(props.modelValue, radius + 1),
    totalPages.value - radius
  );
  const output = [];
  for (
    let page = Math.max(1, middlePage - radius);
    page <= Math.min(middlePage + radius, totalPages.value);
    page++
  ) {
    output.push(page);
  }
  return output;
});
</script>

<template>
  <div class="page">
    <button @click="emit('update:modelValue', 1)" :disabled="modelValue === 1">
      «
    </button>
    <button
      @click="emit('update:modelValue', modelValue - 1)"
      :disabled="modelValue === 1"
    >
      ‹
    </button>
    <button
      v-for="page in visiblePages"
      :key="page"
      @click="emit('update:modelValue', page)"
      :class="{ current: page === modelValue }"
    >
      {{ page }}
    </button>
    <button
      @click="emit('update:modelValue', modelValue + 1)"
      :disabled="modelValue === totalPages"
    >
      ›
    </button>
    <button
      @click="emit('update:modelValue', totalPages)"
      :disabled="modelValue === totalPages"
    >
      »
    </button>
  </div>
</template>

<style lang="sass" scoped>
@import "@/sass/variables.sass"

button
  border: none
  background: none
  padding: .5rem .75rem
  font: inherit
  border: 1px solid #dee2e6

button:not(:first-child)
  border-left: none

button:first-child
  border-top-left-radius: .25rem
  border-bottom-left-radius: .25rem

button:last-child
  border-top-right-radius: .25rem
  border-bottom-right-radius: .25rem

button:enabled
  color: $blue-sapphire
  cursor: pointer

  &:hover
    background-color: $blue-dust

button.current
  background-color: $steel-warrior
  border-color: $steel-warrior
</style>
