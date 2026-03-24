<template>
  <main class="news-list-page">
    <h1>News</h1>

    <div v-if="canEdit" class="admin-actions">
      <BaseButton @click="showCreateForm = true" type="primary">+ Create news</BaseButton>
    </div>

    <BaseModal
      :open="(showCreateForm || !!editingItem) && canEdit"
      @submit="editingItem ? updateNewsItem() : createNewsItem()"
    >
      <template #header>
        <h3>{{ editingItem ? "Edit news item" : "Create news" }}</h3>
      </template>

      <template #body>
        <div class="form-group">
          <label for="news-title">Title:</label>
          <input
            id="news-title"
            v-model="formData.title"
            type="text"
            required
            placeholder="Enter title"
            class="modal-input"
          />
        </div>

        <div class="form-group">
          <label for="news-date">Date:</label>
          <DatePicker name="news-date" v-model="formData.date" :end="today" />
        </div>

        <div class="form-group">
          <div class="content-label-container">
            <label for="news-content">Content:</label>
            <CheckBox v-model="showPreview" label="Preview" />
          </div>
          <textarea
            v-if="!showPreview"
            id="news-content"
            v-model="formData.content"
            rows="10"
            required
            placeholder="Enter content"
            class="modal-textarea"
          ></textarea>
          <div v-else class="preview-container">
            <MarkdownViewer :content="formData.content" />
          </div>
        </div>
      </template>

      <template #footer>
        <BaseButton @click="cancelForm" type="secondary">Cancel</BaseButton>
        <BaseButton type="primary" htmlType="submit">
          {{ editingItem ? "Update" : "Create" }}
        </BaseButton>
      </template>
    </BaseModal>

    <div v-if="loading" class="loading">Loading news...</div>
    <div v-else-if="error" class="error">Failed to load news</div>
    <div v-else class="news-items">
      <div v-for="item in news" :key="item.id" class="news-item-full">
        <div class="news-header">
          <router-link :to="{ name: 'NewsItem', params: { slug: item.slug } }" class="news-title-link">
            <h2>{{ item.title }}</h2>
          </router-link>
          <div v-if="canEdit" class="news-actions">
            <BaseButton @click="startEditing(item)" type="secondary" size="small"> Edit </BaseButton>
            <BaseButton @click="deleteNewsItem(item.slug)" type="danger" size="small"> Delete </BaseButton>
          </div>
        </div>
        <p class="date">{{ formatDate(item.date) }}</p>
        <MarkdownViewer :content="item.content" />
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { backendUrl, dateToString } from "@/lib";
import { hasPermission } from "@/lib/auth";
import BaseModal from "@/components/BaseModal.vue";
import BaseButton from "@/components/BaseButton.vue";
import MarkdownViewer from "@/components/MarkdownViewer.vue";
import CheckBox from "@/components/CheckBox.vue";
import DatePicker from "@/components/DatePicker.vue";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  slug: string;
}

const news = ref<NewsItem[]>([]);
const loading = ref(true);
const error = ref(false);
const showCreateForm = ref(false);
const editingItem = ref<NewsItem | null>(null);

const today = dateToString(new Date());

const formData = ref({
  title: "",
  content: "",
  date: today,
});
const showPreview = ref(false);

// Check if user has admin permissions
const canEdit = hasPermission("canManageNews");

async function fetchNews() {
  try {
    const response = await axios.get<NewsItem[]>(`${backendUrl}news/`);
    news.value = response.data;
  } catch (err) {
    console.error("Failed to fetch news:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

function startEditing(item: NewsItem) {
  editingItem.value = item;
  formData.value = {
    title: item.title,
    content: item.content,
    date: item.date.split("T")[0],
  };
  showCreateForm.value = true;
}

function cancelForm() {
  showCreateForm.value = false;
  editingItem.value = null;
  formData.value = {
    title: "",
    content: "",
    date: today,
  };
}

async function createNewsItem() {
  try {
    const response = await axios.post(`${backendUrl}news/`, formData.value);

    if (response.status === 201) {
      // Refresh the list
      await fetchNews();
      cancelForm();
    }
  } catch (err) {
    console.error("Failed to create news item:", err);
    alert("Failed to create news item. Please try again.");
  }
}

async function updateNewsItem() {
  if (!editingItem.value) return;

  try {
    const response = await axios.put(`${backendUrl}news/${editingItem.value.slug}`, formData.value);

    if (response.status === 200) {
      // Successfully updated, refresh the list
      await fetchNews();
      cancelForm();
    }
  } catch (err) {
    console.error("Failed to update news item:", err);
    alert("Failed to update news item. Please try again.");
  }
}

async function deleteNewsItem(slug: string) {
  if (!confirm("Are you sure you want to delete this news item?")) return;

  try {
    const response = await axios.delete(`${backendUrl}news/${slug}`);

    if (response.status === 204) {
      // Successfully deleted, refresh the list
      await fetchNews();
    }
  } catch (err) {
    console.error("Failed to delete news item:", err);
    alert("Failed to delete news item. Please try again.");
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

onMounted(fetchNews);
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

.create-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.create-button:hover {
  background-color: #2980b9;
}

.modal-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.modal-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  margin-top: 0.5rem;
  resize: vertical;
  min-height: 150px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.content-label-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.content-label-container label {
  margin-bottom: 0;
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

.edit-button {
  background-color: #f39c12;
  color: white;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.delete-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.date {
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.content {
  line-height: 1.6;
  color: #34495e;
  white-space: pre-line;
}
</style>
