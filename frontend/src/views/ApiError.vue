<template>
  <main id="error">
    <h1>{{ response?.status || "Unknown error" }}</h1>
    <h2 v-if="response && response.status !== 500">{{ message }}</h2>
    <h2 v-else>Internal server error</h2>
    <section v-if="response && response.status === 404">The page you are looking for does not exist.</section>
    <section v-if="response && response.status > 500">Service temporarily offline</section>
  </main>
</template>

<script lang="ts" setup>
import { computed } from "vue";

export interface Props {
  response?: { status: number; data: any };
}

const props = defineProps<Props>();

const message = computed(() =>
  props.response
    ? typeof props.response.data == "string"
      ? props.response.data
      : props.response.data.errors.join("<br>")
    : undefined,
);
</script>

<style scoped lang="scss">
h1 {
  font-size: 4em;
  text-align: center;
}

h2 {
  text-align: center;
}

section {
  margin-top: 2em;
  margin-left: auto;
  margin-right: auto;
  width: 35em;
  text-align: center;
  display: block;
}
</style>
