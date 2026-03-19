<template>
  <div class="form-group">
    <label for="person-first-name">First name</label>
    <input
      id="person-first-name"
      :value="firstName"
      type="text"
      required
      :disabled="disabled"
      autocomplete="off"
      @input="$emit('update:firstName', ($event.target as HTMLInputElement).value)"
      @keydown.down.prevent="navigateSuggestion(1)"
      @keydown.up.prevent="navigateSuggestion(-1)"
      @keydown.enter.prevent="confirmSuggestion"
      @keydown.escape="suggestions = []"
      @blur="closeSuggestionsDelayed"
    />
  </div>
  <div class="form-group search-group">
    <label for="person-last-name">Last name</label>
    <input
      id="person-last-name"
      :value="lastName"
      type="text"
      required
      :disabled="disabled"
      autocomplete="off"
      @input="$emit('update:lastName', ($event.target as HTMLInputElement).value)"
      @keydown.down.prevent="navigateSuggestion(1)"
      @keydown.up.prevent="navigateSuggestion(-1)"
      @keydown.enter.prevent="confirmSuggestion"
      @keydown.escape="suggestions = []"
      @blur="closeSuggestionsDelayed"
    />
    <ul v-if="suggestions.length > 0 && !disabled" class="suggestions">
      <li
        v-for="(p, i) in suggestions"
        :key="p.id"
        :class="{ active: i === highlightedIndex }"
        @mousedown.prevent="selectPerson(p)"
        @mouseenter="highlightedIndex = i"
      >
        {{ p.firstName }} {{ p.lastName }}
        <span v-if="p.orcid" class="suggestion-detail">{{ p.orcid }}</span>
        <span v-if="p.email" class="suggestion-detail">{{ p.email }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";

export interface PersonSuggestion {
  id: number;
  firstName: string;
  lastName: string;
  orcid: string | null;
  email: string | null;
}

const props = defineProps<{
  firstName: string;
  lastName: string;
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:firstName": [value: string];
  "update:lastName": [value: string];
  "select": [person: PersonSuggestion];
}>();

const suggestions = ref<PersonSuggestion[]>([]);
const highlightedIndex = ref(-1);
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const searchQuery = computed(() => {
  const first = props.firstName.trim();
  const last = props.lastName.trim();
  return last || first;
});

watch(searchQuery, (query) => {
  if (searchTimer) clearTimeout(searchTimer);
  suggestions.value = [];
  highlightedIndex.value = -1;
  if (props.disabled || !query || query.length < 2) return;
  searchTimer = setTimeout(() => search(query), 300);
});

async function search(query: string) {
  try {
    const res = await axios.get<PersonSuggestion[]>(`${backendUrl}persons/search`, { params: { search: query } });
    if (searchQuery.value === query) {
      suggestions.value = res.data;
    }
  } catch {
    suggestions.value = [];
  }
}

function selectPerson(person: PersonSuggestion) {
  suggestions.value = [];
  emit("select", person);
}

function navigateSuggestion(delta: number) {
  if (suggestions.value.length === 0) return;
  highlightedIndex.value = Math.max(0, Math.min(suggestions.value.length - 1, highlightedIndex.value + delta));
}

function confirmSuggestion() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
    selectPerson(suggestions.value[highlightedIndex.value]);
  }
}

function closeSuggestionsDelayed() {
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    suggestions.value = [];
  }, 150);
}

function reset() {
  suggestions.value = [];
  highlightedIndex.value = -1;
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
  if (closeTimer) clearTimeout(closeTimer);
});

defineExpose({ reset });
</script>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 500;
}

.form-group input {
  padding: 0.4rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:disabled {
  background-color: #f0f0f0;
  color: #666;
}

.search-group {
  position: relative;
}

.suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  position: absolute;
  z-index: 10;
  background: white;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.suggestions li {
  padding: 0.4rem 0.5rem;
  cursor: pointer;
}

.suggestions li:hover,
.suggestions li.active {
  background-color: #f0f0f0;
}

.suggestion-detail {
  color: #888;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}
</style>
