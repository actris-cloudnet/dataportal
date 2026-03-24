<template>
  <main class="news-view">
    <div v-if="loading" class="loading">Loading news item...</div>
    <div v-else-if="error" class="error">Failed to load news item</div>
    <div v-else-if="newsItem" class="news-item-detail">
      <h1>{{ newsItem.title }}</h1>
      <p class="date">{{ formatDate(newsItem.date) }}</p>
      <MarkdownViewer :content="newsItem.content" />
    </div>
    <div v-else class="not-found">News item not found</div>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { backendUrl } from "@/lib";
import MarkdownViewer from "@/components/MarkdownViewer.vue";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  slug: string;
}

const route = useRoute();
const newsItem = ref<NewsItem | null>(null);
const loading = ref(true);
const error = ref(false);

async function fetchNewsItem() {
  try {
    const slug = route.params.slug;
    const response = await axios.get<NewsItem>(`${backendUrl}news/${slug}`);
    newsItem.value = response.data;
  } catch (err) {
    console.error("Failed to fetch news item:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

onMounted(fetchNewsItem);
</script>

<style scoped lang="scss">
h1 {
  font-size: 170%;
  font-weight: 300;
}

.news-view {
  max-width: 60rem;
  margin: 2rem auto;
  padding: 0 1rem;
}

.loading,
.error,
.not-found {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.error {
  color: #e74c3c;
}

.news-item-detail {
  background: white;
  border-radius: 8px;
}

.news-item-detail h1 {
  margin-top: 0;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.date {
  color: #7f8c8d;
  margin-bottom: 1.5rem;
}
</style>
