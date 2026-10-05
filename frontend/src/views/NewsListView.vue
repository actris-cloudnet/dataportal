<template>
  <main class="news-list-page">
    <h1>News</h1>

    <div v-if="canEdit" class="admin-actions">
      <BaseButton @click="showCreateForm = true" type="primary">+ Create news</BaseButton>
    </div>

    <NewsEditor
      :open="(showCreateForm || !!editingItem) && canEdit"
      :item="editingItem"
      @saved="onSaved"
      @cancel="cancelForm"
    />

    <div v-if="loading" class="loading">Loading news...</div>
    <div v-else-if="error" class="error">Failed to load news</div>
    <template v-else>
      <div class="news-items">
        <div v-for="item in apiResponse.results" :key="item.id" class="news-item-full">
          <div class="news-header">
            <router-link :to="{ name: 'NewsItem', params: { slug: item.slug } }" class="news-title-link">
              <h2>{{ item.title }}{{ item.draft ? " (draft)" : "" }}</h2>
            </router-link>
            <div v-if="canEdit" class="news-actions">
              <BaseButton @click="startEditing(item)" type="secondary" size="small"> Edit </BaseButton>
              <BaseButton @click="deleteNewsItem(item.slug)" type="danger" size="small"> Delete </BaseButton>
            </div>
          </div>
          <p class="date">{{ formatDisplayDate(item.date) }}</p>
          <MarkdownViewer :content="item.content" />
        </div>
      </div>
      <BasePagination
        v-if="apiResponse.pagination.totalPages > 1"
        v-model="currentPage"
        :totalPages="apiResponse.pagination.totalPages"
        :disabled="loading"
        class="news-pagination"
      />
    </template>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import { backendUrl, formatDisplayDate } from "@/lib";
import { hasPermission } from "@/lib/auth";
import BaseButton from "@/components/BaseButton.vue";
import BasePagination from "@/components/BasePagination.vue";
import MarkdownViewer from "@/components/MarkdownViewer.vue";
import NewsEditor from "@/components/NewsEditor.vue";
import type { NewsItem } from "@shared/entity/NewsItem";
import type { NewsPaginatedResponse } from "@shared/entity/NewsPaginatedResponse";

const apiResponse = ref<NewsPaginatedResponse>({
  results: [],
  pagination: {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  },
});
const loading = ref(true);
const error = ref(false);
const showCreateForm = ref(false);
const editingItem = ref<NewsItem | null>(null);
const currentPage = ref(1);
const pageSize = 10;

const canEdit = hasPermission("canManageNews");

async function fetchNews(page = 1) {
  try {
    loading.value = true;
    const response = await axios.get<NewsPaginatedResponse>(`${backendUrl}news/`, {
      params: { page, pageSize },
    });
    apiResponse.value = response.data;
  } catch (err) {
    console.error("Failed to fetch news:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

watch(currentPage, async (newPage) => {
  await fetchNews(newPage);
});

function startEditing(item: NewsItem) {
  editingItem.value = item;
}

function cancelForm() {
  showCreateForm.value = false;
  editingItem.value = null;
}

async function onSaved() {
  if (!editingItem.value) currentPage.value = 1;
  await fetchNews(currentPage.value);
  cancelForm();
}

async function deleteNewsItem(slug: string) {
  if (!confirm("Are you sure you want to delete this news item?")) return;

  try {
    await axios.delete(`${backendUrl}news/${slug}`);
    // If we're on a page that might now be empty, reset to page 1
    if (apiResponse.value.pagination.totalItems <= pageSize) {
      currentPage.value = 1;
    }
    await fetchNews(currentPage.value);
  } catch (err) {
    console.error("Failed to delete news item:", err);
    alert("Failed to delete news item. Please try again.");
  }
}

onMounted(() => fetchNews(currentPage.value));
</script>

<style scoped lang="scss">
.news-list-page {
  max-width: 60rem;
  margin: 2rem auto;
  padding: 0 1rem;
}

h1 {
  font-size: 170%;
  font-weight: 300;
  margin-bottom: 2rem;
}

.admin-actions {
  margin-bottom: 2rem;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.error {
  color: #e74c3c;
}

.news-items {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.news-title-link {
  text-decoration: none;
  color: inherit;
}

.news-header h2 {
  font-size: 120%;
  font-weight: 300;
}

.news-actions {
  display: flex;
  gap: 0.5rem;
}

.date {
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.news-pagination {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}
</style>
