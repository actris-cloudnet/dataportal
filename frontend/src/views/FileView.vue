<template>
  <main v-if="response" id="landing">
    <div v-if="!isBusy && newestVersion" class="banner-container">
      <div class="banner pagewidth">
        There is a
        <router-link :to="`/file/${newestVersion}`">newer version</router-link>
        of this data available.
      </div>
    </div>
    <LandingHeader :title="title" :subtitle="humanReadableDate(response.measurementDate)">
      <template #tags>
        <FileTags :response="response" />
      </template>
      <template #actions>
        <BaseButton type="primary" :href="response.downloadUrl">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          Download
        </BaseButton>
      </template>
      <template #tabs>
        <router-link class="tab" :to="{ name: 'File' }">
          <img :src="getProductIcon(response.product.id)" alt="" />
          Summary
        </router-link>
        <router-link class="tab" :to="{ name: 'FileVisualizations' }">
          <img :src="PhotoGalleryIcon" alt="" />
          Visualisations
        </router-link>
        <router-link class="tab" :to="{ name: 'FileQualityReport' }" v-if="response.errorLevel">
          <img :src="getQcIcon(response.errorLevel)" alt="" />
          Quality report
        </router-link>
      </template>
    </LandingHeader>
    <div class="landing-content-background">
      <router-view
        :uuid="uuid"
        :response="response"
        :location="location"
        :instrument="instrument"
        :instrumentStatus="instrumentStatus"
        :isBusy="isBusy"
        :versions="versions"
        :sourceFiles="sourceFiles"
        :visualizations="visualizations"
        :loadingVisualizations="loadingVisualizations"
        :title="title"
      />
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import axios from "axios";
import { humanReadableDate, fetchInstrumentName, compareValues } from "@/lib";
import type { RegularFile, ModelFile } from "@shared/entity/File";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import type { SiteType } from "@shared/entity/Site";
import type { SiteLocation } from "@shared/entity/SiteLocation";
import type { File } from "@shared/entity/File";
import BaseButton from "@/components/BaseButton.vue";
import FileTags from "@/components/FileTags.vue";
import { getProductIcon, getQcIcon } from "@/lib";

import PhotoGalleryIcon from "@/assets/icons/photo-gallery.png";
import LandingHeader from "@/components/LandingHeader.vue";

export type SourceFile = { ok: true; uuid: string; value: File } | { ok: false; uuid: string; value: Error };

export interface Props {
  uuid: string;
}

export type FileResponse = ModelFile | RegularFile;

const props = defineProps<Props>();

const apiUrl = import.meta.env.VITE_BACKEND_URL;

const response = ref<FileResponse | null>(null);
const visualizations = ref<VisualizationItem[]>([]);
const versions = ref<string[]>([]);
const error = ref(false);
const sourceFiles = ref<SourceFile[]>([]);
const isBusy = ref(false);
const instrument = ref("");
const instrumentStatus = ref<"loading" | "error" | "ready">("loading");
const loadingVisualizations = ref(true);
const location = ref<SiteLocation | null>(null);

const title = computed(() =>
  response.value
    ? `${response.value.product.humanReadableName} data from ${response.value.site.humanReadableName}`
    : "",
);

const currentVersionIndex = computed(() => {
  if (response.value == null) return null;
  return versions.value.findIndex((uuid) => uuid == props.uuid);
});

const newestVersion = computed(() => {
  if (!currentVersionIndex.value) return null;
  return versions.value[0];
});

async function fetchVisualizations() {
  try {
    const response = await axios.get(`${apiUrl}visualizations/${props.uuid}`);
    visualizations.value = response.data.visualizations;
  } catch (error) {
    console.error(error);
  }
  loadingVisualizations.value = false;
}

async function fetchFileMetadata() {
  try {
    const res = await axios.get(`${apiUrl}files/${props.uuid}`);
    response.value = res.data;
    if (response.value) {
      await fetchLocation(response.value);
    }
  } catch (err: any) {
    error.value = true;
    response.value = err.response;
  }
}

async function fetchLocation(file: ModelFile | RegularFile) {
  if (!file.site.type.includes("mobile" as SiteType)) {
    location.value = null;
    return;
  }
  try {
    const response = await axios.get(`${apiUrl}sites/${file.site.id}/locations/${file.measurementDate}`);
    location.value = response.data;
  } catch (err) {
    location.value = null;
  }
}

function fetchVersions(file: File) {
  // No need to reload versions
  if (versions.value.includes(file.uuid)) return;
  const payload = {
    params: {
      filename: file.filename,
      allVersions: true,
      showLegacy: true,
    },
  };
  return axios.get(`${apiUrl}files`, payload).then((response) => {
    const searchFiles = response.data as File[];
    versions.value = searchFiles.map((sf) => sf.uuid);
  });
}

async function fetchSourceFiles(response: RegularFile | ModelFile) {
  if (!("sourceFileIds" in response) || !response.sourceFileIds) {
    sourceFiles.value = [];
    return;
  }
  const results = await Promise.all(
    response.sourceFileIds.map((uuid) =>
      axios
        .get(`${apiUrl}files/${uuid}`)
        .then((response) => ({ ok: true, uuid, value: response.data }))
        .catch((error) => ({ ok: false, uuid, value: error })),
    ),
  );
  results.sort((a, b) => {
    if (!a.ok || !b.ok) return -1;
    return compareValues(a.value.product.humanReadableName, b.value.product.humanReadableName);
  });
  sourceFiles.value = results;
}

async function fetchInstrument(file: RegularFile | ModelFile) {
  if (!("instrumentPid" in file) || file.instrumentPid == null) {
    return;
  }
  const pid = (file as RegularFile).instrumentPid;
  try {
    instrument.value = await fetchInstrumentName(pid);
    instrumentStatus.value = "ready";
  } catch (err) {
    console.error("Failed to load instrument:", err);
    instrumentStatus.value = "error";
  }
}

watch(
  () => props.uuid,
  async () => {
    isBusy.value = true;
    await fetchFileMetadata();
    if (response.value == null || error.value) return;
    await Promise.all([
      fetchInstrument(response.value),
      fetchVisualizations(),
      fetchVersions(response.value),
      fetchSourceFiles(response.value),
    ]);
    isBusy.value = false;
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

main {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.banner-container {
  background-color: $actris-yellow;
}

.banner {
  padding-top: 1rem;
  padding-bottom: 1rem;

  a {
    font-weight: 600;
  }
}

.landing-content-background {
  background-color: #edf0f2;
  padding-top: 1rem;
  padding-bottom: 1rem;
  height: 100%;
}

:deep() {
  .summary-box {
    display: flex;
    flex-direction: column;
    padding: 2rem;
    background-color: white;
    border-radius: 5px;
    box-shadow: 0 0.1em 0.6em 0 rgba(0, 0, 0, 0.15);
    block-size: 100%;
  }

  .summary-section + .summary-section {
    margin-top: 2rem;
  }

  .summary-section-header {
    margin-bottom: 0.5rem;
    font-size: 140%;
    font-weight: 400;
  }

  .summary-section-table {
    display: grid;
    grid-template-columns: minmax(min-content, 14rem) auto;
    row-gap: 0.4rem;

    dt {
      font-weight: 500;
    }
  }

  @media screen and (max-width: 600px) {
    .summary-box {
      padding: 1rem;
      box-shadow: none;
      border-radius: 0;
    }

    .summary-section-table {
      display: flex;
      flex-direction: column;

      dd + dt {
        margin-top: 0.5rem;
      }
    }
  }
}
</style>
