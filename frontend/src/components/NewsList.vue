<template>
  <div class="news-list" v-if="news.length > 0">
    <h2>Latest news</h2>
    <div v-if="loading" class="loading">Loading news...</div>
    <div v-else-if="error" class="error">Failed to load news</div>
    <div class="news-items" v-else>
      <template v-for="item in news" :key="item.id">
        <span class="news-date">{{ formatDisplayDate(item.date) }}</span>
        <router-link :to="{ name: 'NewsItem', params: { slug: item.slug } }" class="news-title">
          {{ item.title }}
        </router-link>
      </template>
    </div>
    <div class="all-news-link">
      <router-link :to="{ name: 'NewsList' }" class="read-all">All news →</router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { backendUrl, formatDisplayDate } from "@/lib";
import type { NewsItem } from "@shared/entity/NewsItem";

const news = ref<NewsItem[]>([]);
const loading = ref(true);
const error = ref(false);

async function fetchNews() {
  try {
    const response = await axios.get<NewsItem[]>(`${backendUrl}news`, { params: { limit: 5 } });
    news.value = response.data;
  } catch (err) {
    console.error("Failed to fetch news:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchNews);
</script>

<style scoped lang="scss">
.news-list {
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.25rem;
}

.news-items {
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 0.5rem;
  align-items: center;
}

.news-date {
  text-align: right;
  white-space: nowrap;
  color: gray;
  font-size: 0.9rem;
}

.loading,
.error {
  text-align: center;
  padding: 1rem;
  color: #7f8c8d;
}

.error {
  color: #e74c3c;
}

.all-news-link {
  margin-top: 1rem;
  text-align: center;
}

.read-all {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}
</style>
