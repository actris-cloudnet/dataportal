<template>
  <div>
    <LandingHeader title="Publications" />
    <main class="pagewidth">
      <p>
        List of publications that use Cloudnet data or describe methods used for Cloudnet data processing, and other
        relevant publications.
      </p>
      <form v-if="canEdit" @submit.prevent="submitPublication">
        <input type="text" v-model="publicationUri" placeholder="Enter DOI..." />
        <BaseButton type="primary" htmlType="submit" :disabled="addingPublication">Add</BaseButton>
      </form>
      <template v-if="publications.status == 'ready'">
        <h2>Publication year</h2>
        <ul class="toc">
          <li v-for="[year, _pubs] in publications.data" :key="year">
            <a :href="`#year-${year}`">{{ year }}</a>
          </li>
        </ul>
        <template v-for="[year, pubs] in publications.data" :key="year">
          <h2 :id="`year-${year}`">{{ year }}</h2>
          <ul class="publications">
            <li v-for="pub in pubs" :key="pub.pid">
              <span class="citation-text" v-html="formatCitation(pub)"></span>
              <BaseButton
                type="danger"
                size="small"
                v-if="canEdit"
                @click="removePublication(pub)"
                class="remove-button"
              >
                Remove
              </BaseButton>
            </li>
          </ul>
        </template>
      </template>
      <BaseSpinner v-else-if="publications.status == 'loading'" />
      <div v-else-if="publications.status == 'error'">Failed to load publications.</div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import type { Publication } from "@shared/entity/Publication";
import LandingHeader from "@/components/LandingHeader.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";
import BaseButton from "@/components/BaseButton.vue";
import { backendUrl } from "@/lib";
import { hasPermission } from "@/lib/auth";

function groupBySorted<T, K>(items: T[], keyFrom: (item: T) => K, order: "asc" | "desc"): [K, T[]][] {
  const grouped = items.reduce((result, item) => {
    const value = keyFrom(item);
    if (result.has(value)) result.get(value).push(item);
    else result.set(value, [item]);
    return result;
  }, new Map());
  const result = Array.from(grouped.entries());
  result.sort((a, b) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return 0;
  });
  if (order == "desc") result.reverse();
  return result;
}

type PublicationState =
  | { status: "loading" }
  | { status: "ready"; data: [string, Publication[]][] }
  | { status: "error" };

const publications = ref<PublicationState>({ status: "loading" });

const canEdit = hasPermission("canAddPublication");
const publicationUri = ref("");
const addingPublication = ref(false);

onMounted(async () => {
  await updatePublications();
});

function formatCitation(pub: Publication): string {
  return pub.citation.replace(/\<a/, '<a target="_blank"');
}

async function updatePublications() {
  try {
    publications.value = { status: "loading" };
    const response = await axios.get<Publication[]>(`${backendUrl}publications`);
    publications.value = {
      status: "ready",
      data: groupBySorted(response.data, (item) => item.publishedAt.slice(0, 4), "desc"),
    };
  } catch (error) {
    console.error(error);
    publications.value = { status: "error" };
  }
}

async function submitPublication() {
  try {
    addingPublication.value = true;
    await axios.post(`${backendUrl}publications`, { uri: publicationUri.value });
    await updatePublications();
    publicationUri.value = "";
  } catch (err) {
    alert(`Failed to add publication: ${err}`);
  } finally {
    addingPublication.value = false;
  }
}

async function removePublication(pub: Publication) {
  try {
    if (!confirm(`Remove ${pub.pid}?`)) return;
    await axios.delete(`${backendUrl}publications`, {
      params: { uri: pub.pid },
    });
    await updatePublications();
  } catch (err) {
    alert(`Failed to remove publication: ${err}`);
  }
}
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

:deep(.pagewidth) {
  max-width: 1000px;
}

main {
  padding-bottom: 1rem;
}

h2 {
  font-size: 1.4rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.publications {
  li {
    margin-left: 1.5rem;
    text-indent: -1.5rem;
  }

  li + li {
    margin-top: 0.5rem;
  }
}

.toc {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
}

form {
  border-radius: 4px;
  display: inline-flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

input {
  width: 400px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.remove-button.small {
  margin-left: 0.5rem;
  text-indent: 0;
}

.citation-text :deep(i) {
  font-style: italic;
}
</style>
