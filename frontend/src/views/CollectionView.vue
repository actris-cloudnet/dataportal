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

#sitemap .details
  height: 300px
</style>

<template>
  <div>
    <div v-if="!error && response">
      <LandingHeader
        :title="response.title || 'Custom collection'"
        subtitle="User-defined selection of files from Cloudnet data portal"
      >
        <template #tabs>
          <router-link
            class="tab"
            :to="{ name: 'Collection', params: { mode: 'general' } }"
            :replace="true"
            :class="{ 'router-link-active': mode === 'general' }"
          >
            <img :src="briedIcon" alt="" />
            Summary
          </router-link>
          <router-link
            class="tab"
            :to="{ name: 'Collection', params: { mode: 'files' } }"
            :replace="true"
            :class="{ 'router-link-active': mode === 'files' }"
          >
            <img :src="folderIcon" alt="" />
            Files
          </router-link>
        </template>
      </LandingHeader>
      <main id="collectionlanding" class="pagewidth">
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
            <section id="editCollection" class="rightView" v-if="mode === 'general'">
              <BaseAlert type="error" v-if="pidServiceError">
                Failed to create DOI for this collection. Please try again later.
              </BaseAlert>
              <how-to-cite :uuid="citationBusy ? undefined : response.uuid" />
              <h3>License</h3>
              <license></license>
              <h3>Download</h3>
              By clicking the download button you confirm that you have taken notice of the above data licensing
              information.<br />
              <BaseButton type="primary" :href="downloadUrl" id="downloadCollection">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                Download
              </BaseButton>
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
    </div>
    <ApiError v-else-if="error" />
  </div>
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
import folderIcon from "@/assets/icons/icons8-folder-48.png";
import briedIcon from "@/assets/icons/icons8-brief-48.png";
import LandingHeader from "@/components/LandingHeader.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseAlert from "@/components/BaseAlert.vue";

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
        citationBusy.value = false;
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
