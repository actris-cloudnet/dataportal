<script lang="ts" setup>
import type { RouteLocationRaw } from "vue-router";

export interface Props {
  to?: RouteLocationRaw;
  href?: string;
  type: "primary" | "secondary" | "brand" | "danger";
  size?: "normal" | "small";
  disabled?: boolean;
  htmlType?: HTMLButtonElement["type"];
}

withDefaults(defineProps<Props>(), { disabled: false, htmlType: "button", size: "normal" });

defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <router-link :to="to" class="button" :class="[type, size]" @click="$emit('click')" v-if="to && !disabled">
    <slot></slot>
  </router-link>
  <a :href="href" class="button" :class="[type, size]" @click="$emit('click')" v-else-if="href && !disabled">
    <slot></slot>
  </a>
  <button class="button" :type="htmlType" :class="[type, size]" @click="$emit('click')" :disabled="disabled" v-else>
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped>
@import "@/sass/variables.scss";

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  padding: 0.5rem 1rem;
  color: white;
  fill: white;
  border-radius: 4px;
  user-select: none;

  :deep(svg) {
    margin-right: 0.25rem;
    margin-left: -0.1rem;
  }

  &:hover {
    text-decoration: none;
  }

  &.primary {
    background-color: $actris-green;

    &:hover,
    &:focus-visible {
      text-decoration: none;
      background-color: darken($actris-green, 10%);
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px rgba($actris-green, 0.5);
    }
  }

  &.brand {
    background-color: $blue-sapphire;

    &:hover,
    &:focus-visible {
      text-decoration: none;
      background-color: darken($blue-sapphire, 10%);
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px rgba($blue-sapphire, 0.5);
    }
  }

  &.secondary {
    color: #333;
    fill: #333;
    background-color: $gray1;

    &:hover,
    &:focus-visible {
      text-decoration: none;
      background-color: darken($gray1, 10%);
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px rgba($gray1, 0.75);
    }
  }

  &.danger {
    background-color: $red1;

    &:hover,
    &:focus-visible {
      text-decoration: none;
      background-color: darken($red1, 10%);
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px rgba($red1, 0.5);
    }
  }

  &.small {
    margin: 0;
    padding: 0 5px;
    font-size: 0.8rem;
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }
}
</style>
