<template>
  <ApiError v-if="error" :response="response as any" />
  <div v-else-if="response">
    <LandingHeader
      :title="response.title || 'Custom collection'"
      subtitle="User-defined selection of files from Cloudnet data portal"
    >
      <template #tabs>
        <router-link class="tab" :to="{ name: 'Collection' }">
          <img :src="briefIcon" alt="" />
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
          <section id="sitemap" v-if="response.sites.length > 0">
            <SuperMap :sites="response.sites" :zoom="3" />
          </section>
          <section id="summary">
            <dl>
              <dt>Date span</dt>
              <dd>{{ response.startDate }} &ndash; {{ response.endDate }}</dd>
              <dt>File count</dt>
              <dd>{{ response.files }}</dd>
              <dt>Total size</dt>
              <dd>{{ humanReadableSize(response.size) }}</dd>
              <dt>Products</dt>
              <dd id="products">
                <div v-for="product in response.products" :key="product.id">
                  <img :src="getProductIcon(product.id)" class="product" />
                  {{ product.humanReadableName }}
                </div>
              </dd>
            </dl>
          </section>
        </main>
        <div class="rightView">
          <BaseAlert type="error" v-if="response.tombstonedFiles">
            Some files in this collection has been deleted. They are still included in the download.
          </BaseAlert>
          <BaseAlert type="warning" v-if="false">
            Some files in the this collection have newer versions available.
          </BaseAlert>
          <BaseAlert type="warning" v-if="hasExperimentalProducts">
            This collection contains experimental products which are still under development.
          </BaseAlert>
          <BaseAlert type="note" v-if="response.volatileFiles">
            This collection contains volatile files which may be updated in the future.
          </BaseAlert>
          <RouterView :collection="response" />
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import type { Collection } from "@shared/entity/Collection";
import { backendUrl, getProductIcon, humanReadableSize } from "@/lib";
import SuperMap from "@/components/SuperMap.vue";
import ApiError from "./ApiError.vue";
import folderIcon from "@/assets/icons/icons8-folder-48.png";
import briefIcon from "@/assets/icons/icons8-brief-48.png";
import LandingHeader from "@/components/LandingHeader.vue";
import BaseAlert from "@/components/BaseAlert.vue";

export interface Props {
  uuid: string;
}

const props = defineProps<Props>();

const error = ref(false);
const response = ref<Collection | null>(null);

const hasExperimentalProducts = computed(() => response.value?.products.some((product) => product.experimental));

onMounted(async () => {
  try {
    const res = await axios.get(`${backendUrl}collection/${props.uuid}`);
    response.value = res.data;
    if (response.value == null) return;
  } catch (err: any) {
    error.value = true;
    response.value = err.response;
  }
});
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

dl {
  display: grid;
  grid-template-columns: auto 4fr;
  column-gap: 2rem;
  row-gap: 0.4rem;
  margin-top: 1rem;
}

dt {
  font-weight: 500;
  max-width: 11em;
}

dd {
  margin: 0;
}

img.product {
  height: auto;
  width: 1em;
  margin-right: 0.3em;
}

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

#sitemap {
  height: 300px;
  padding: 0;
}
</style>
