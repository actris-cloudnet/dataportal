<script setup lang="ts">
interface Props {
  type: "actris" | "arm" | "volatile" | "legacy" | "experimental";
  title?: string;
}

defineProps<Props>();
</script>

<template>
  <span :class="['tag', type]" :title="title"><slot></slot></span>
</template>

<style scoped lang="scss">
@import "@/sass/variables.scss";

.tag {
  color: white;
  font-size: 90%;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
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
