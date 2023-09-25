<script lang="ts" setup>
import type { RouteLocationRaw } from "vue-router";

export interface Props {
  to?: RouteLocationRaw;
  href?: string;
  type: "primary" | "secondary";
}

defineProps<Props>();

defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <router-link :to="to" class="button" :class="type" @click="$emit('click')" v-if="to">
    <slot></slot>
  </router-link>
  <a :href="href" class="button" :class="type" @click="$emit('click')" v-else-if="href">
    <slot></slot>
  </a>
  <button class="button" :class="type" @click="$emit('click')" v-else>
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped>
@import "@/sass/new-variables";

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  padding: 0.5rem 1rem;
  color: white;
  fill: white;
  border-radius: 4px;

  &:hover {
    text-decoration: none;
  }

  &.primary {
    background-color: $actris-green;

    &:hover {
      text-decoration: none;
      background-color: darken($actris-green, 10%);
    }
  }

  &.secondary {
    color: #333;
    fill: #333;
    background-color: $gray1;

    &:hover {
      text-decoration: none;
      background-color: darken($gray1, 10%);
    }
  }
}
</style>
