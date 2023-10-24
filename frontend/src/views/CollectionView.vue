<template>
  <ApiError v-if="error" :response="response as any" />
  <div v-else-if="response">
    <LandingHeader
      :title="response.title || 'Custom collection'"
      subtitle="User-defined selection of files from Cloudnet data portal"
    >
      <template #tabs>
        <router-link class="tab" :to="{ name: 'Collection' }">
          <img :src="briedIcon" alt="" />
          Summary
        </router-link>
        <router-link class="tab" :to="{ name: 'CollectionFiles' }">
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
                <dd>{{ startDate }} &ndash; {{ endDate }}</dd>
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
              <SuperMap :sites="sites" :zoom="3" />
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
          <RouterView :collection="response" :files="sortedFiles" />
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import type { CollectionResponse } from "@shared/entity/CollectionResponse";
import { backendUrl, combinedFileSize, constructTitle, getProductIcon, humanReadableSize } from "@/lib";
import type { Site } from "@shared/entity/Site";
import SuperMap from "@/components/SuperMap.vue";
import type { Product } from "@shared/entity/Product";
import type { CollectionFileResponse } from "@shared/entity/CollectionFileResponse";
import type { Model } from "@shared/entity/Model";
import ApiError from "./ApiError.vue";
import folderIcon from "@/assets/icons/icons8-folder-48.png";
import briedIcon from "@/assets/icons/icons8-brief-48.png";
import LandingHeader from "@/components/LandingHeader.vue";

export interface Props {
  uuid: string;
}

const props = defineProps<Props>();

const error = ref(false);
const response = ref<CollectionResponse | null>(null);
const sortedFiles = ref<CollectionFileResponse[]>([]);
const sites = ref<Site[]>([]);
const products = ref<Product[]>([]);
const models = ref<Model[]>([]);
const nonModelSiteIds = ref<string[]>([]);

const startDate = computed(() => sortedFiles.value && sortedFiles.value[sortedFiles.value.length - 1].measurementDate);

const endDate = computed(() => sortedFiles.value[0].measurementDate);

function getUnique(arr: CollectionFileResponse[], field: keyof CollectionFileResponse) {
  return arr
    .map((file) => file[field])
    .reduce((acc: string[], cur) => (typeof cur == "string" && !acc.includes(cur) ? acc.concat([cur]) : acc), []);
}

const totalSize = computed(() => {
  return combinedFileSize(sortedFiles.value);
});

onMounted(async () => {
  try {
    const res = await axios.get(`${backendUrl}collection/${props.uuid}`);
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
    const siteIds = getUnique(sortedFiles.value, "siteId");
    const productIds = getUnique(sortedFiles.value, "productId");
    const modelIds = getUnique(sortedFiles.value, "modelId");
    const [sitesRes, modelsRes, productsRes] = await Promise.all([
      axios.get(`${backendUrl}sites/`),
      axios.get(`${backendUrl}models/`),
      axios.get(`${backendUrl}products/`),
    ]);
    sites.value = sitesRes.data.filter((site: Site) => siteIds.includes(site.id));
    products.value = productsRes.data.filter((product: Product) => productIds.includes(product.id));
    models.value = modelsRes.data.filter((model: Product) => modelIds.includes(model.id));
  } catch (err: any) {
    error.value = true;
    response.value = err.response;
  }
});
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";
@import "@/sass/landing.scss";

div.flex {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

main.column {
  flex-direction: column;
  align-content: flex-start;
  margin-right: 80px;
  margin-bottom: 40px;
}

@media screen and (max-width: $narrow-screen) {
  main.column {
    margin-right: 0;
  }
}

.rightView {
  flex: 1 1 600px;

  > h3 {
    margin-top: 2em;
    margin-bottom: 0.7em;
  }

  > h3:nth-child(1) {
    margin-top: 0;
  }
}

#sitemap .details {
  height: 300px;
  padding: 0;
}
</style>
