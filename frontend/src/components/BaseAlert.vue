<script setup lang="ts">
import warningIcon from "@/assets/icons/test-warning-mono.svg";

export interface Props {
  type?: "info" | "note" | "warning" | "error";
}

defineProps<Props>();
</script>

<template>
  <div class="alert" :class="type">
    <img class="icon" alt="" :src="warningIcon" />
    <div class="body"><slot></slot></div>
  </div>
</template>

<style lang="scss" scoped>
@import "@/sass/variables.scss";

.alert {
  display: flex;
  align-items: center;
  border-radius: 4px;
  font-weight: 400;
  font-size: 90%;
  padding: 0.5rem 1rem;
  margin-bottom: 0.7em;
}

.info {
  background-color: rgba($gray3, 0.4);
}

.note {
  background-color: rgba($blue3, 0.4);
}

.warning {
  background-color: rgba($yellow1, 0.4);
}

.error {
  background-color: rgba($red4, 0.4);
}

.icon {
  height: 1rem;
  padding-right: 0.5rem;
  opacity: 0.4;
}
</style>
