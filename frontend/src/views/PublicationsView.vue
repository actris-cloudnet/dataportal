<style scoped lang="sass">
@import "../sass/variables.sass"

h1
  margin-bottom: 4rem

.year
  display: flex
  align-items: top
  margin-top: 2rem

h2
  flex: 0 0 80px

ul
  padding-left: 1em

@media screen and (max-width: $narrow-screen)
  h1
    margin-bottom: 2rem

  .year
    display: block
    margin-top: 3rem

  h2
    margin-bottom: 1em
</style>

<template>
  <main>
    <h1>Cloudnet publications</h1>
    <template v-if="publications.status == 'ready'">
      <div v-for="[year, pubs] in publications.data" :key="year" class="year">
        <h2>{{ year }}</h2>
        <ul>
          <li v-for="pub in pubs" :key="pub.pid">
            <p v-html="pub.citation"></p>
          </li>
        </ul>
      </div>
    </template>
    <div v-else-if="publications.status == 'loading'">
      Loading publications...
    </div>
    <div v-else-if="publications.status == 'error'">
      Failed to load publications.
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import type { AxiosResponse } from "axios";
import type { Publication } from "@shared/entity/Publication";

function groupBySorted<T, K extends keyof T>(
  items: T[],
  key: K,
  order: "asc" | "desc"
): [T[K], T[]][] {
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

onMounted(async () => {
  try {
    const response: AxiosResponse<Publication[]> = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}publications`
    );
    publications.value = {
      status: "ready",
      data: groupBySorted(response.data, "year", "desc"),
    };
  } catch (error) {
    console.error(error);
    publications.value = { status: "error" };
  }
});
</script>
