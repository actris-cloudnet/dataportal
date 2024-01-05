import { onMounted, onUnmounted, ref } from "vue";

export function useInnerSize() {
  const innerWidth = ref(window.innerWidth);
  const innerHeight = ref(window.innerHeight);

  function update() {
    innerWidth.value = window.innerWidth;
    innerHeight.value = window.innerHeight;
  }

  onMounted(() => window.addEventListener("resize", update));
  onUnmounted(() => window.removeEventListener("resize", update));

  return { innerWidth, innerHeight };
}
