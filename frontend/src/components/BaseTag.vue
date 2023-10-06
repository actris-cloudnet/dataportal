<script setup lang="ts">
export type TagSize = "normal" | "small";

export interface Props {
  type: "actris" | "arm" | "volatile" | "legacy" | "experimental";
  title?: string;
  size?: TagSize;
}

withDefaults(defineProps<Props>(), { size: "normal" });
</script>

<template>
  <span :class="['tag', size, type]" :title="title"><slot></slot></span>
</template>

<style scoped lang="scss">
@import "@/sass/variables.scss";

.tag {
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
  padding: 0.1rem 0.4rem;
}

.experimental {
  background-color: #ec9706;
}

.actris {
  background-color: $actris-turquoise;
}

.arm {
  background-color: #194173;
}

.volatile {
  background-color: $blue3;
}

.legacy {
  background-color: $gray4;
}
</style>
