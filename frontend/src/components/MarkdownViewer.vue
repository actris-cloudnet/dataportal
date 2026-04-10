<template>
  <div class="markdown-content" v-html="renderedHtml"></div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import * as commonmark from "commonmark";

const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();

const props = defineProps<{ content: string }>();

const renderedHtml = computed(() => {
  try {
    const parsed = reader.parse(props.content);
    return writer.render(parsed);
  } catch (error) {
    console.error("Markdown parsing error:", error);
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

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(strong) {
  font-weight: 500;
}
</style>
