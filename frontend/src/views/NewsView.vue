<template>
  <main class="news-view">
    <div v-if="loading" class="loading">Loading news item...</div>
    <div v-else-if="error" class="error">Failed to load news item</div>
    <div v-else-if="newsItem" class="news-item-detail">
      <div class="news-header">
        <h1>{{ newsItem.title }}{{ newsItem.draft ? " (draft)" : "" }}</h1>
        <div v-if="canEdit" class="news-actions">
          <BaseButton @click="editing = true" type="secondary" size="small"> Edit </BaseButton>
          <BaseButton @click="deleteNewsItem" type="danger" size="small"> Delete </BaseButton>
        </div>
      </div>
      <p class="date">{{ formatDisplayDate(newsItem.date) }}</p>
      <MarkdownViewer :content="newsItem.content" />
      <NewsEditor :open="editing && canEdit" :item="newsItem" @saved="onSaved" @cancel="editing = false" />
    </div>
    <div v-else class="not-found">News item not found</div>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { backendUrl, formatDisplayDate } from "@/lib";
import { hasPermission } from "@/lib/auth";
import BaseButton from "@/components/BaseButton.vue";
import MarkdownViewer from "@/components/MarkdownViewer.vue";
import NewsEditor from "@/components/NewsEditor.vue";
import type { NewsItem } from "@shared/entity/NewsItem";

const route = useRoute();
const newsItem = ref<NewsItem | null>(null);
const loading = ref(true);
const error = ref(false);
const editing = ref(false);

const router = useRouter();
const canEdit = hasPermission("canManageNews");

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

async function onSaved(item?: NewsItem) {
  editing.value = false;
  if (!item) return;
  newsItem.value = item;
  if (item.slug !== route.params.slug) {
    await router.replace({ name: "NewsItem", params: { slug: item.slug } });
  }
}

async function deleteNewsItem() {
  if (!newsItem.value) return;
  if (!confirm("Are you sure you want to delete this news item?")) return;

  try {
    await axios.delete(`${backendUrl}news/${newsItem.value.slug}`);
    await router.push({ name: "NewsList" });
  } catch (err) {
    console.error("Failed to delete news item:", err);
    alert("Failed to delete news item. Please try again.");
  }
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

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.news-actions {
  display: flex;
  gap: 0.5rem;
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
