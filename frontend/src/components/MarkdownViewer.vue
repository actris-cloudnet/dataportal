<template>
  <div class="markdown-content" v-html="renderedHtml"></div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import * as commonmark from "commonmark";

interface Props {
  content: string;
}

const props = defineProps<Props>();

const renderedHtml = computed(() => {
  try {
    const reader = new commonmark.Parser();
    const writer = new commonmark.HtmlRenderer();
    const parsed = reader.parse(props.content);
    return writer.render(parsed);
  } catch (error) {
    console.error("Markdown parsing error:", error);
    // Fallback to raw text if parsing fails
    return props.content.replace(/\n/g, "<br>");
  }
});
</script>

<style scoped>
.markdown-content :deep(p) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 0.5rem;
  padding-left: 2rem;
}

.markdown-content :deep(ul) {
  list-style: disc;
}

.markdown-content :deep(ol) {
  list-style: decimal;
}
</style>
