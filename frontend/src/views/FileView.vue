<style scoped lang="sass">
@import "../sass/landing-beta.sass"
.landing-tags
  .tag
    display: flex
    justify-content: center
    align-items: center
    color: white
    font-size: 90%
    font-weight: 550
    inline-size: max-content
    block-size: min-content
    padding: 0.23*$basespacing 0.52*$basespacing
    border-radius: 2.5*$baseradius
    cursor: default
    &:first-child
      margin-left: $basespacing
    &:not(:first-child)
      margin-left: 0.7*$basespacing
  .experimental
    background-color: #EC9706
  .actris
    background-color: $actris-turquoise
  .volatile
    background-color: $BLUE-3-hex
  .legacy
    background-color: $GRAY-4-hex
</style>

<template>
  <main v-if="response" id="landing">
    <div
      v-if="!isBusy && newestVersion"
      class="landing-version-banner-container"
    >
      <div class="landing-version-banner">
        There is a
        <router-link
          class="landing-version-banner-link"
          :to="`/file/${newestVersion}`"
          >newer version</router-link
        >
        of this data available.
      </div>
    </div>
    <div class="landing-header-container">
      <div class="landing-title">
        {{ title }}
      </div>
      <div class="landing-tags">
        <div
          v-if="isActrisObject"
          class="tag actris"
          title="Data from an operational ACTRIS site"
        >
          Actris
        </div>
        <div
          v-if="response.volatile"
          class="tag volatile"
          title="Data may change in future"
        >
          Volatile
        </div>
        <div
          v-if="response.legacy"
          class="tag legacy"
          title="Produced using non-standardized processing"
        >
          Legacy
        </div>
        <div
          v-if="response.product.experimental"
          class="tag experimental"
          title="Experimental product"
        >
          Experimental
        </div>
      </div>
      <div class="landing-download">
        <DownloadButton :downloadUrl="response.downloadUrl" />
      </div>
      <div class="landing-subtitle">
        {{ humanReadableDate(response.measurementDate) }}
      </div>
    </div>
    <div class="tab-container">
      <router-link class="tab" :to="{ name: 'File' }">Summary</router-link>
      <router-link class="tab" :to="{ name: 'FileVisualizations' }">
        Visualisations
      </router-link>
      <router-link class="tab" :to="{ name: 'FileQualityReport' }">
        Quality report
      </router-link>
    </div>
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
      />
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ref, computed, watch, watchEffect } from "vue";
import axios from "axios";
import {
  humanReadableDate,
  sortVisualizations,
  fetchInstrumentName,
  compareValues,
} from "../lib";
import { DevMode } from "../lib/DevMode";
import type { RegularFile, ModelFile } from "@shared/entity/File";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import type { SiteType } from "@shared/entity/Site";
import type { SiteLocation } from "@shared/entity/SiteLocation";
import type { File } from "@shared/entity/File";
import DownloadButton from "../components/landing/DownloadButton.vue";

export type SourceFile =
  | { ok: true; value: File }
  | { ok: false; value: Error };

export interface Props {
  uuid: string;
}

export type FileResponse = ModelFile | RegularFile;

const props = defineProps<Props>();

const apiUrl = import.meta.env.VITE_BACKEND_URL;
const devMode = new DevMode();

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

const title = computed(() => {
  if (!response.value) {
    return "Cloudnet Data Object";
  } else {
    return `${response.value.product.humanReadableName} data from ${response.value.site.humanReadableName}`;
  }
});

watchEffect(() => {
  document.title = title.value;
});

const isActrisObject = computed(() => {
  if (!response.value) {
    return false;
  }
  return response.value.site.type.includes("cloudnet" as SiteType);
});

const currentVersionIndex = computed(() => {
  if (response.value == null) return null;
  return versions.value.findIndex((uuid) => uuid == props.uuid);
});

const newestVersion = computed(() => {
  if (!currentVersionIndex.value) return null;
  return versions.value[0];
});

async function fetchVisualizations(payload: {}) {
  try {
    const response = await axios.get(
      `${apiUrl}visualizations/${props.uuid}`,
      payload
    );
    visualizations.value = sortVisualizations(response.data.visualizations);
  } catch (error) {
    console.error(error);
  }
  loadingVisualizations.value = false;
}

async function fetchFileMetadata(payload: {}) {
  try {
    const res = await axios.get(`${apiUrl}files/${props.uuid}`, payload);
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
    const response = await axios.get(
      `${apiUrl}sites/${file.site.id}/locations/${file.measurementDate}`
    );
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
      developer: devMode.activated || undefined,
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
        .then((response) => ({ ok: true, value: response.data }))
        .catch((error) => ({ ok: false, value: error }))
    )
  );
  results.sort((a, b) => {
    if (!a.ok || !b.ok) return -1;
    return compareValues(
      a.value.product.humanReadableName,
      b.value.product.humanReadableName
    );
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
    const payload = { params: { developer: devMode.activated || undefined } };
    await fetchFileMetadata(payload);
    if (response.value == null || error.value) return;
    await Promise.all([
      fetchInstrument(response.value),
      fetchVisualizations(payload),
      fetchVersions(response.value),
      fetchSourceFiles(response.value),
    ]);
    isBusy.value = false;
  },
  { immediate: true }
);
</script>
