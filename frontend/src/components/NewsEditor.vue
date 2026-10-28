<template>
  <BaseModal :open="open" @submit="save">
    <template #header>
      <h3>{{ item ? "Edit news item" : "Create news" }}</h3>
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

      <div class="form-group">
        <CheckBox v-model="formData.draft" label="Draft" />
      </div>
    </template>

    <template #footer>
      <BaseButton @click="$emit('cancel')" type="secondary">Cancel</BaseButton>
      <BaseButton type="primary" htmlType="submit" :disabled="saving">
        {{ item ? "Save" : "Create" }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import axios from "axios";
import { backendUrl, dateToString } from "@/lib";
import BaseModal from "@/components/BaseModal.vue";
import BaseButton from "@/components/BaseButton.vue";
import MarkdownViewer from "@/components/MarkdownViewer.vue";
import CheckBox from "@/components/CheckBox.vue";
import DatePicker from "@/components/DatePicker.vue";
import type { NewsItem } from "@shared/entity/NewsItem";

export interface Props {
  open: boolean;
  item?: NewsItem | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "saved", item?: NewsItem): void;
  (e: "cancel"): void;
}>();

const today = dateToString(new Date());

const formData = ref({
  title: "",
  content: "",
  date: today,
  draft: false,
});
const showPreview = ref(false);
const saving = ref(false);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const item = props.item;
    formData.value = {
      title: item ? item.title : "",
      content: item ? item.content : "",
      date: item ? item.date.split("T")[0] : today,
      draft: item ? item.draft || false : false,
    };
    showPreview.value = false;
  },
  { immediate: true },
);

async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    if (props.item) {
      const response = await axios.put<NewsItem>(`${backendUrl}news/${props.item.slug}`, formData.value);
      emit("saved", response.data);
    } else {
      await axios.post(`${backendUrl}news/`, formData.value);
      emit("saved");
    }
  } catch (err) {
    console.error("Failed to save news item:", err);
    alert("Failed to save news item. Please try again.");
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
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
</style>
