<template>
  <div :class="spinnerClass"></div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  size?: "normal" | "small";
}

const props = withDefaults(defineProps<Props>(), { size: "normal" });

const spinnerClass = computed(() => ["lds-dual-ring", `lds-dual-ring-${props.size}`]);
</script>

<style lang="scss" scoped>
.lds-dual-ring {
  display: inline-block;
  width: 80px;
  height: 80px;

  &::after {
    content: " ";
    display: block;
    width: 64px;
    height: 64px;
    margin: 8px;
    border-radius: 50%;
    border: 6px solid #ccc;
    border-color: #ccc transparent #ccc transparent;
    animation: lds-dual-ring 1.2s linear infinite;
  }
}

@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.lds-dual-ring-small {
  width: 20px;
  height: 20px;

  &::after {
    display: flex;
    width: 16px;
    height: 16px;
    margin: 0px;
    border-width: 2.5px;
  }
}
</style>
