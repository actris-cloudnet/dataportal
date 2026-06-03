<template>
  <div>
    <div v-if="loading" class="loading">Loading publications...</div>
    <div v-else-if="error" class="error">Failed to load publications</div>
    <div v-else-if="publications.length > 0" class="publication-container">
      <ul class="publication-list">
        <li v-for="item in publications" :key="item.pid" class="publication-item" v-html="item.citation"></li>
      </ul>
      <BaseButton type="secondary" :to="{ name: 'Publications' }" class="read-all">All publications →</BaseButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import type { Publication } from "@shared/entity/Publication";
import BaseButton from "@/components/BaseButton.vue";

const publications = ref<Publication[]>([]);
const loading = ref(true);
const error = ref(false);

async function fetchPublications() {
  try {
    const response = await axios.get<Publication[]>(`${backendUrl}publications`, { params: { limit: 3 } });
    publications.value = response.data.map((pub) => ({
      ...pub,
      citation: pub.citation.replace(/,[^(]+/, " et al. "),
    }));
  } catch (err) {
    console.error("Failed to fetch publications:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchPublications);
</script>

<style scoped lang="scss">
.publication-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.publication-list {
  text-indent: -1.5rem;
  margin-left: 1.5rem;
}

.publication-item + .publication-item {
  margin-top: 0.5rem;
}

:deep(.publication-item i) {
  font-style: italic;
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
</style>
