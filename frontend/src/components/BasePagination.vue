<script lang="ts" setup>
import { computed } from "vue";

export interface Props {
  totalPages: number;
  disabled: boolean;
}

const props = defineProps<Props>();

const currentPage = defineModel<number>({ required: true });

const radius = 1;
const visiblePages = computed(() => {
  const middlePage = Math.min(Math.max(currentPage.value, radius + 1), props.totalPages - radius);
  const startPage = Math.max(1, middlePage - radius);
  const endPage = Math.min(middlePage + radius, props.totalPages);
  const output = [];
  for (let page = startPage; page <= endPage; page++) {
    output.push(page);
  }
  return output;
});
</script>

<template>
  <div class="page">
    <button @click="currentPage = 1" :disabled="modelValue === 1">«</button>
    <button @click="currentPage -= 1" :disabled="modelValue === 1">‹</button>
    <button
      v-for="page in visiblePages"
      :key="page"
      @click="currentPage = page"
      :class="{ current: page === modelValue }"
    >
      {{ page }}
    </button>
    <button @click="currentPage += 1" :disabled="modelValue === totalPages">›</button>
    <button @click="currentPage = totalPages" :disabled="modelValue === totalPages">»</button>
  </div>
</template>

<style lang="scss" scoped>
@use "@/sass/variables.scss";

button {
  border: none;
  background: none;
  padding: 0.5rem 0.75rem;
  font: inherit;
  border: 1px solid #dee2e6;

  &:not(:first-child) {
    border-left: none;
  }

  &:first-child {
    border-top-left-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
  }

  &:last-child {
    border-top-right-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
  }

  &:enabled {
    color: variables.$blue-sapphire;
    cursor: pointer;

    &:hover {
      background-color: variables.$blue-dust;
    }
  }

  &.current {
    background-color: variables.$steel-warrior;
    border-color: variables.$steel-warrior;
  }

  &:disabled {
    color: silver;
  }
}
</style>
