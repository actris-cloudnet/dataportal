<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/landing.sass"

div.flex
  display: flex
  justify-content: center
  flex-wrap: wrap

main.column
  flex-direction: column
  align-content: flex-start
  margin-right: 80px
  margin-bottom: 40px
@media screen and (max-width: $narrow-screen)
  main.column
    margin-right: 0

.rightView
  flex: 1 1 600px

  > h3
    margin-top: 2em
    margin-bottom: 0.7em
  > h3:nth-child(1)
    margin-top: 0

.internalNavi
  margin-bottom: 2em
  text-align: center

  > a
    margin: 0

.router-link-active
  color: black
  font-weight: bold
  text-decoration: none
  cursor: default

.download
  display: inline-block
  margin-top: 0.5em

#editCollection
  ul
    margin-top: 0.5em
  li
    list-style: none
  h4
    margin-top: 1em
  .infobox
    padding: 1em
</style>

<template>
  <main id="collectionlanding" v-if="!error && response">
    <img id="backButton" :src="backIcon" @click="$router.back()" />
    <header>
      <h2>{{ response.title || "Custom collection" }}</h2>
    </header>
    <div class="flex">
      <main class="infoBox column">
        <section id="summary">
          <header>Summary</header>
          <section class="details">
            <dl>
              <dt>Date span</dt>
              <dd>{{ startDate }} - {{ endDate }}</dd>
              <dt>File count</dt>
              <dd>{{ sortedFiles.length }}</dd>
              <dt>Total size</dt>
              <dd>{{ humanReadableSize(totalSize) }}</dd>
            </dl>
          </section>
        </section>
        <section id="sitemap" v-if="sites.length > 0">
          <header>Sites</header>
          <section class="details">
            <my-map :sites="sites" :center="[34.0, -14.0]" :zoom="1" />
          </section>
        </section>
        <section id="products">
          <header>Products</header>
          <section class="details">
            <div v-for="product in products" :key="product.id">
              <img :src="getProductIcon(product.id)" class="product" />
              {{ product.humanReadableName }}
            </div>
          </section>
        </section>
      </main>
      <div class="rightView">
        <nav class="internalNavi">
          <router-link
            :to="{ name: 'Collection', params: { mode: 'general' } }"
            :replace="true"
            :class="{ 'router-link-active': mode === 'general' }"
          >
            General
          </router-link>
          |
          <router-link
            :to="{ name: 'Collection', params: { mode: 'files' } }"
            :replace="true"
            :class="{ 'router-link-active': mode === 'files' }"
          >
            All files
          </router-link>
        </nav>
        <section id="editCollection" class="rightView" v-if="mode === 'general'">
          <h3>How to cite</h3>
          <span v-if="citationBusy" style="color: gray">Generating citation...</span>
          <div v-else-if="pidServiceError" class="errormsg">
            PID service is unavailable. Please try again later. You may still download the collection.
          </div>
          <how-to-cite
            v-if="!citationBusy"
            :citation="citation"
            :acknowledgements="acknowledgements"
            :dataAvailability="dataAvailability"
          />

          <h3>License</h3>
          <license></license>

          <h3>Download</h3>
          By clicking the download button you confirm that you have taken notice of the above data licensing
          information.<br />
          <a class="download" :href="downloadUrl" id="downloadCollection">
            Download collection
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          </a>
        </section>
        <data-search-result
          v-else
          :simplifiedView="true"
          :apiResponse="sortedFiles"
          :isBusy="busy"
          :downloadUri="downloadUrl"
        >
        </data-search-result>
      </div>
    </div>
  </main>
  <ApiError v-else-if="error" />
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import type { CollectionResponse } from "@shared/entity/CollectionResponse";
import { combinedFileSize, constructTitle, getProductIcon, humanReadableSize } from "@/lib";
import type { Site } from "@shared/entity/Site";
import MyMap from "@/components/SuperMap.vue";
import type { Product } from "@shared/entity/Product";
import DataSearchResult from "@/components/DataSearchResult.vue";
import HowToCite from "@/components/HowToCite.vue";
import License from "@/components/LicenseInfo.vue";
import type { CollectionFileResponse } from "@shared/entity/CollectionFileResponse";
import type { Model } from "@shared/entity/Model";
import ApiError from "./ApiError.vue";
import backIcon from "@/assets/icons/back.png";

export interface Props {
  uuid: string;
  mode: string;
}

const props = defineProps<Props>();

const error = ref(false);
const response = ref<CollectionResponse | null>(null);
const sortedFiles = ref<CollectionFileResponse[]>([]);
const sites = ref<Site[]>([]);
const products = ref<Product[]>([]);
const models = ref<Model[]>([]);
const apiUrl = import.meta.env.VITE_BACKEND_URL;
const busy = ref(false);
const citationBusy = ref(false);
const pidServiceError = ref(false);
const nonModelSiteIds = ref<string[]>([]);
const citation = ref<string>("");
const acknowledgements = ref<string>("");
const dataAvailability = ref<string>("");

const startDate = computed(() => sortedFiles.value && sortedFiles.value[sortedFiles.value.length - 1].measurementDate);

const endDate = computed(() => sortedFiles.value[0].measurementDate);

const downloadUrl = computed(() => {
  if (!response.value) return undefined;
  return `${apiUrl}download/collection/${response.value.uuid}`;
});

function getUnique(arr: CollectionFileResponse[], field: keyof CollectionFileResponse) {
  return arr
    .map((file) => file[field])
    .reduce((acc: string[], cur) => (typeof cur == "string" && !acc.includes(cur) ? acc.concat([cur]) : acc), []);
}

const totalSize = computed(() => {
  return combinedFileSize(sortedFiles.value);
});

async function generatePid(): Promise<void> {
  if (!response.value || response.value.pid) return;
  try {
    const payload = {
      type: "collection",
      uuid: props.uuid,
    };
    const pidRes = await axios.post(`${apiUrl}generate-pid`, payload);
    if (!response.value) return;
    response.value.pid = pidRes.data.pid;
  } catch (error) {
    pidServiceError.value = true;
    console.error(error);
  }
}

onMounted(() => {
  busy.value = true;
  citationBusy.value = true;
  return axios
    .get(`${apiUrl}collection/${props.uuid}`)
    .then((res) => {
      response.value = res.data;
      if (response.value == null) return;
      sortedFiles.value = constructTitle(
        response.value.files.sort(
          (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime(),
        ),
      );
      nonModelSiteIds.value = getUnique(
        sortedFiles.value.filter((file) => file.productId != "model"),
        "siteId",
      );
    })
    .catch((error) => {
      error.value = true;
      response.value = error.response;
    })
    .then(() => {
      generatePid().finally(() => {
        Promise.all([
          axios.get(`${apiUrl}reference/${props.uuid}?citation=true&format=html`),
          axios.get(`${apiUrl}reference/${props.uuid}?acknowledgements=true&format=html`),
          axios.get(`${apiUrl}reference/${props.uuid}?dataAvailability=true&format=html`),
        ]).then(([citationRes, ackRes, availRes]) => {
          citationBusy.value = false;
          citation.value = citationRes.data;
          acknowledgements.value = ackRes.data;
          dataAvailability.value = availRes.data;
        });
      });
      const siteIds = getUnique(sortedFiles.value, "siteId");
      const productIds = getUnique(sortedFiles.value, "productId");
      const modelIds = getUnique(sortedFiles.value, "modelId");
      return Promise.all([
        axios.get(`${apiUrl}sites/`),
        axios.get(`${apiUrl}models/`),
        axios.get(`${apiUrl}products/`),
      ]).then(([sitesRes, modelsRes, productsRes]) => {
        sites.value = sitesRes.data.filter((site: Site) => siteIds.includes(site.id));
        products.value = productsRes.data.filter((product: Product) => productIds.includes(product.id));
        models.value = modelsRes.data.filter((model: Product) => modelIds.includes(model.id));
      });
    })
    .catch(console.error)
    .finally(() => {
      busy.value = false;
    });
});
</script>
