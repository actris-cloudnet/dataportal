<template>
  <div>
    <LandingHeader title="Publications" />
    <main class="pagewidth">
      <p>
        List of publications that are related to the Cloudnet processing scheme or use data from the Cloudnet data
        portal.
      </p>
      <form v-if="canEdit" @submit.prevent="submitPublication">
        <input type="text" v-model="publicationUri" placeholder="Enter DOI..." />
        <BaseButton type="primary" htmlType="submit" :disabled="addingPublication">Add</BaseButton>
      </form>
      <template v-if="publications.status == 'ready'">
        <div v-for="[year, pubs] in publications.data" :key="year" class="year">
          <h2>{{ year }}</h2>
          <ul>
            <li v-for="pub in pubs" :key="pub.pid">
              <span class="citation-text" v-html="pub.citation"></span>
              <a v-if="canEdit" class="remove-button" href="#" @click.prevent="removePublication(pub)">(remove)</a>
            </li>
          </ul>
        </div>
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
import { hasPermission, loginStore } from "@/lib/auth";

function groupBySorted<T, K extends keyof T>(items: T[], key: K, order: "asc" | "desc"): [T[K], T[]][] {
  const grouped = items.reduce((result, item) => {
    const value = item[key];
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
  | { status: "ready"; data: [Publication["year"], Publication[]][] }
  | { status: "error" };

const publications = ref<PublicationState>({ status: "loading" });

const canEdit = hasPermission("canAddPublication");
const publicationUri = ref("");
const addingPublication = ref(false);

onMounted(async () => {
  await updatePublications();
});

async function updatePublications() {
  try {
    publications.value = { status: "loading" };
    const response = await axios.get<Publication[]>(`${backendUrl}publications`);
    publications.value = {
      status: "ready",
      data: groupBySorted(response.data, "year", "desc"),
    };
  } catch (error) {
    console.error(error);
    publications.value = { status: "error" };
  }
}

async function submitPublication() {
  try {
    addingPublication.value = true;
    await axios.post(
      `${backendUrl}publications`,
      { uri: publicationUri.value },
      { auth: { username: loginStore.username, password: loginStore.password } },
    );
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
      auth: { username: loginStore.username, password: loginStore.password },
    });
    await updatePublications();
  } catch (err) {
    alert(`Failed to remove publication: ${err}`);
  }
}
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

main {
  padding-bottom: 1rem;
}

.year {
  display: flex;
  align-items: top;
  margin-top: 2rem;
}

h2 {
  font-size: 1.4rem;
  flex: 0 0 80px;
}

ul {
  margin-left: 2rem;
}

li {
  text-indent: -2rem;
}

li + li {
  margin-top: 0.5rem;
}

@media screen and (max-width: variables.$narrow-screen) {
  h1 {
    margin-bottom: 2rem;
  }

  .year {
    display: block;
    margin-top: 3rem;
  }

  h2 {
    margin-bottom: 1em;
  }
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

.remove-button {
  margin-left: 0.5rem;
  color: gray;
}

.citation-text :deep(i) {
  font-style: italic;
}
</style>
