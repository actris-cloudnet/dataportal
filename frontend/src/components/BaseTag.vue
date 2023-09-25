<script setup lang="ts">
interface Props {
  type: "actris" | "volatile" | "legacy" | "experimental";
  title?: string;
}

defineProps<Props>();
</script>

<template>
  <span :class="['tag', type]" :title="title"><slot></slot></span>
</template>

<style scoped lang="scss">
@import "@/sass/landing-beta.sass";

.tag {
  color: white;
  font-size: 90%;
  font-weight: 600;
  padding: 0.25 * $basespacing 0.65 * $basespacing;
  border-radius: 999px;
}

.experimental {
  background-color: #ec9706;
}

.actris {
  background-color: $actris-turquoise;
}

.volatile {
  background-color: $BLUE-3-hex;
}

.legacy {
  background-color: $GRAY-4-hex;
}
</style>
