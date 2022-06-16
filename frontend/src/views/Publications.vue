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
    <div v-for="[year, pubs] in publicationsByYear" :key="year" class="year">
      <h2>{{ year }}</h2>
      <ul>
        <li v-for="pub in pubs" :key="pub.pid">
          <p v-html="pub.citation"></p>
        </li>
      </ul>
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import axios, { AxiosResponse } from "axios";
import { Publication } from "../../../backend/src/entity/Publication";

function groupBySorted<T, K extends keyof T>(items: T[], key: K, order: "asc" | "desc"): [T[K], T][] {
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

@Component({
  components: {},
})
export default class PubView extends Vue {
  apiUrl = process.env.VUE_APP_BACKENDURL;
  publicationsByYear: [Publication["year"], Publication][] = [];

  data() {
    return {
      publications: null,
    };
  }

  async created() {
    const response: AxiosResponse<Publication[]> = await axios.get(`${this.apiUrl}publications`);
    this.publicationsByYear = groupBySorted(response.data, "year", "desc");
  }
}
</script>
