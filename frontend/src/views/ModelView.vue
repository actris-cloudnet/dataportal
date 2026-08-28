<template>
  <BaseSpinner v-if="loading" />
  <div v-else-if="model">
    <LandingHeader :title="model.humanReadableName" subtitle="Cloudnet model product"></LandingHeader>
    <main class="pagewidth">
      <div v-html="modelDescription"></div>
      <div class="columns">
        <div v-if="modelInfo" class="info-column">
          <h2>Product overview</h2>
          <table>
            <tbody>
              <tr>
                <th>Model domain</th>
                <td>{{ modelInfo.domain }}</td>
              </tr>
              <tr>
                <th>Horizontal resolution</th>
                <td>{{ modelInfo.horizontalResolution }}</td>
              </tr>
              <tr>
                <th>Vertical resolution</th>
                <td>{{ modelInfo.verticalResolution }}</td>
              </tr>
              <tr>
                <th>Temporal resolution</th>
                <td>{{ modelInfo.timeResolution }}</td>
              </tr>
              <tr>
                <th>Forecast availability</th>
                <td>{{ modelInfo.forecast }}</td>
              </tr>
              <tr>
                <th>Model runs</th>
                <td>{{ modelInfo.runs }}</td>
              </tr>
            </tbody>
          </table>
          <template v-if="Object.keys(modelInfo.links).length > 0">
            <h2>Links</h2>
            <ul>
              <li v-for="link in modelLinks" :key="link" v-html="link"></li>
            </ul>
          </template>
        </div>
        <div class="data-column">
          <h2>Product availability</h2>
          <template v-if="allSites.length > 0">
            <p>Near real-time model data are available for the following sites:</p>
            <div class="map-container">
              <SuperMap
                v-if="allSites.length > 0"
                :sites="allSites"
                :onMapMarkerClick="onMapMarkerClick"
                :polygon="modelInfo?.boundary"
              />
            </div>
          </template>
          <p v-else style="color: gray">No recent model data available.</p>
        </div>
      </div>
    </main>
  </div>
  <ApiError :response="errorResponse" v-else-if="error" />
</template>

<script lang="ts" setup>
import LandingHeader from "@/components/LandingHeader.vue";
import { backendUrl } from "@/lib";
import type { Model } from "@shared/entity/Model";
import axios from "axios";
import { computed, onMounted, ref } from "vue";
import modelsJson from "@/assets/models.yaml";
import type { Site } from "@shared/entity/Site";
import type { ModelFile } from "@shared/entity/File";
import { useTitle } from "@/router";
import SuperMap from "@/components/SuperMap.vue";
import { useRouter } from "vue-router";
import BaseSpinner from "@/components/BaseSpinner.vue";
import ApiError from "./ApiError.vue";

export interface Props {
  modelId: string;
}

const props = defineProps<Props>();

const loading = ref(true);
const error = ref(false);
const errorResponse = ref<any>(null);
const model = ref<Model | null>(null);
const allSites = ref<Site[]>([]);

const router = useRouter();

const modelInfo = computed(() => modelsJson[props.modelId]);
const modelDescription = computed(() =>
  modelInfo.value ? "<p>" + modelInfo.value.description.split("\n\n").join("</p><p>") + "</p>" : "",
);
const modelLinks = computed(() =>
  modelInfo.value ? modelInfo.value.links.map((link: string) => link.replace("<a", '<a target="_blank"')) : "",
);

const title = computed(() => [model.value?.humanReadableName, "Models"]);

useTitle(title);

onMounted(async () => {
  try {
    const res = await axios.get(`${backendUrl}models/${props.modelId}`);
    model.value = res.data;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const siteRes = await axios.get<Site[]>(`${backendUrl}sites`, {
      params: { type: ["cloudnet", "campaign", "model", "weather-radar", "arm"] },
    });
    const fileRes = await axios.get<ModelFile[]>(`${backendUrl}model-files`, {
      params: { model: props.modelId, dateFrom: weekAgo, site: siteRes.data.map((site) => site.id) },
    });
    const uniqueSites: any = {};
    for (const file of fileRes.data) {
      uniqueSites[file.site.id] = file.site;
    }
    allSites.value = Object.values(uniqueSites);
  } catch (e: any) {
    error.value = true;
    errorResponse.value = e.response;
  } finally {
    loading.value = false;
  }
});

function onMapMarkerClick(siteIds: Site["id"][]) {
  if (siteIds.length == 0) return;
  router
    .push({
      name: "SiteProducts",
      params: { siteId: siteIds[0] },
      query: { product: "model", model: props.modelId },
    })
    .catch(() => {
      /* skip */
    });
}
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

:deep(.pagewidth) {
  max-width: 1000px;
}

:deep(p) {
  margin-bottom: 0.5rem;
}

:deep(i) {
  font-style: italic;
}

table {
  margin-top: 1rem;
}

th,
td {
  padding: 0.25rem 0.5rem;
}

th {
  font-weight: 500;
}

h2 {
  font-size: 120%;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

h3 {
  font-size: 110%;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

ul {
  list-style: disc;
  padding-left: 1rem;
}

.columns {
  display: flex;
  gap: 1rem;
}

.info-column {
  flex-grow: 1;
}

.data-column {
  flex-basis: 500px;
}

.map-container {
  height: 300px;
  margin-top: 0.5rem;
}

@media screen and (max-width: variables.$narrow-screen) {
  .columns {
    flex-direction: column;
  }
}
</style>
