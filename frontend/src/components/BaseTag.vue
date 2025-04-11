<script setup lang="ts">
export type TagSize = "normal" | "small";

export interface Props {
  type: "actris" | "arm" | "volatile" | "legacy" | "experimental" | "cloudnet" | "ri-urbans";
  title?: string;
  size?: TagSize;
}

withDefaults(defineProps<Props>(), { size: "normal" });
</script>

<template>
  <span :class="['tag', size, type]" :title="title"><slot></slot></span>
</template>

<style scoped lang="scss">
@use "@/sass/variables.scss";

.tag {
  display: inline-block;
  color: white;
  font-weight: 600;
  border-radius: 999px;
}

.normal {
  font-size: 90%;
  padding: 0.25rem 0.65rem;
}

.small {
  font-size: 75%;
  padding: 0.1rem 0.5rem;
}

.experimental {
  background-color: variables.$experimental;
}

.actris {
  background-color: variables.$actris-turquoise;
}

.arm {
  background-color: #194173;
}

.volatile {
  background-color: variables.$blue3;
}

.legacy {
  background-color: variables.$gray4;
}

.cloudnet {
  background-color: variables.$cloudnet-blue;
}

.ri-urbans {
  background-color: #99ba5f;
}
</style>
