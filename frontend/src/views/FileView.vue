<template>
  <div v-if="isBusy"></div>
  <ApiError v-else-if="error" :response="file as any" />
  <main v-else-if="file" id="landing">
    <div v-if="file.tombstoneReason" class="banner-container-obsolete">
      <div class="banner pagewidth">
        This data object is not suitable for use: {{ file.tombstoneReason.replace(/\.$/, "") }}.
      </div>
    </div>
    <div v-if="newestVersion" class="banner-container">
      <div class="banner pagewidth">
        There is a
        <router-link :to="`/file/${newestVersion}`">newer version</router-link>
        of this data available.
      </div>
    </div>
    <LandingHeader :title="title" :subtitle="humanReadableDate(file.measurementDate)">
      <template #tags>
        <FileTags :response="file" />
      </template>
      <template #actions>
        <BaseButton
          type="danger"
          @click="openDeleteModal"
          :disabled="deleteBusy"
          v-if="hasPermission('canDelete').value && !file.tombstoneReason"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M 10.806641 2 C 10.289641 2 9.7956875 2.2043125 9.4296875 2.5703125 L 9 3 L 4 3 A 1.0001 1.0001 0 1 0 4 5 L 20 5 A 1.0001 1.0001 0 1 0 20 3 L 15 3 L 14.570312 2.5703125 C 14.205312 2.2043125 13.710359 2 13.193359 2 L 10.806641 2 z M 4.3652344 7 L 5.8925781 20.263672 C 6.0245781 21.253672 6.877 22 7.875 22 L 16.123047 22 C 17.121047 22 17.974422 21.254859 18.107422 20.255859 L 19.634766 7 L 4.3652344 7 z"
            />
          </svg>
          Delete
        </BaseButton>
        <BaseButton type="primary" :href="file.downloadUrl">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          Download
        </BaseButton>
      </template>
      <template #tabs>
        <router-link class="tab" :to="{ name: 'File' }">
          <img :src="getProductIcon(file.product.id)" alt="" />
          Summary
        </router-link>
        <router-link class="tab" :to="{ name: 'FileVisualizations' }">
          <img :src="PhotoGalleryIcon" alt="" />
          Visualisations
        </router-link>
        <router-link class="tab" :to="{ name: 'FileQualityReport' }" v-if="file.errorLevel">
          <img :src="getQcIcon(file.errorLevel)" alt="" />
          Quality report
        </router-link>
      </template>
    </LandingHeader>
    <div class="landing-content-background">
      <router-view
        :uuid="uuid"
        :file="file"
        :location="location"
        :isBusy="isBusy"
        :versions="versions"
        :sourceFiles="sourceFiles"
        :visualizations="visualizations"
        :loadingVisualizations="loadingVisualizations"
        :title="title"
      />
    </div>
  </main>

  <Teleport to="body">
    <BaseModal :open="showDeleteModal" @submit="deleteFile">
      <template #header> Delete files? </template>
      <template #body>
        The following files will be deleted:
        <ul class="file-list">
          <li v-for="file in filesToDelete" :key="file.uuid">
            {{ file.s3key }}
            ({{ file.volatile ? "volatile" : "stable" }})
          </li>
        </ul>
        <label v-if="requireTombstoneReason">
          Please provide a tombstone reason:
          <input type="text" v-model="tombstoneReason" required placeholder="Tombstone reason..." />
        </label>
      </template>
      <template #footer>
        <BaseButton type="secondary" @click="showDeleteModal = false" :disabled="deleteBusy">Cancel</BaseButton>
        <BaseButton type="danger" :disabled="deleteBusy" htmlType="submit">Delete</BaseButton>
      </template>
    </BaseModal>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import axios from "axios";
import { humanReadableDate, compareValues, backendUrl } from "@/lib";
import type { RegularFile, ModelFile } from "@shared/entity/File";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import type { SiteLocation } from "@shared/entity/SiteLocation";
import type { File } from "@shared/entity/File";
import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";
import FileTags from "@/components/FileTags.vue";
import { getProductIcon, getQcIcon } from "@/lib";
import ApiError from "./ApiError.vue";
import { hasPermission, loginStore } from "@/lib/auth";

import PhotoGalleryIcon from "@/assets/icons/photo-gallery.png";
import LandingHeader from "@/components/LandingHeader.vue";

export interface Props {
  uuid: string;
}

export type FileResponse = ModelFile | RegularFile;

const props = defineProps<Props>();

const file = ref<FileResponse | null>(null);
const visualizations = ref<VisualizationItem[]>([]);
const versions = ref<string[]>([]);
const error = ref(false);
const sourceFiles = ref<FileResponse[]>([]);
const isBusy = ref(false);
const loadingVisualizations = ref(true);
const location = ref<SiteLocation | null>(null);

const deleteBusy = ref(false);
const showDeleteModal = ref(false);
const filesToDelete = ref<File[]>([]);
const tombstoneReason = ref("");
const requireTombstoneReason = computed(() => filesToDelete.value.some((file) => file.pid));

const title = computed(() =>
  file.value ? `${file.value.product.humanReadableName} data from ${file.value.site.humanReadableName}` : "",
);

const currentVersionIndex = computed(() => {
  if (file.value == null) return null;
  const fileUuid = file.value.uuid;
  return versions.value.findIndex((uuid) => uuid == fileUuid);
});

const newestVersion = computed(() => {
  if (!currentVersionIndex.value) return null;
  return versions.value[0];
});

async function fetchVisualizations(file: FileResponse) {
  try {
    const response = await axios.get(`${backendUrl}visualizations/${file.uuid}`);
    visualizations.value = response.data.visualizations;
  } catch (error) {
    console.error(error);
  }
  loadingVisualizations.value = false;
}

async function fetchFileMetadata() {
  try {
    const res = await axios.get(`${backendUrl}files/${props.uuid}`);
    file.value = res.data;
    if (file.value) {
      await fetchLocation(file.value);
    }
  } catch (err: any) {
    error.value = true;
    file.value = err.response;
  }
}

async function fetchLocation(file: FileResponse) {
  if (!file.site.type.includes("mobile")) {
    location.value = null;
    return;
  }
  try {
    const response = await axios.get(`${backendUrl}sites/${file.site.id}/locations/${file.measurementDate}`);
    location.value = response.data;
  } catch (err) {
    location.value = null;
  }
}

function fetchVersions(file: FileResponse) {
  // No need to reload versions
  if (versions.value.includes(file.uuid)) return;
  return axios.get(`${backendUrl}files/${props.uuid}/versions`).then((response) => {
    const searchFiles = response.data as File[];
    versions.value = searchFiles.map((sf) => sf.uuid);
  });
}

async function fetchSourceFiles(file: FileResponse) {
  if (!("sourceFileIds" in file) || !file.sourceFileIds) {
    sourceFiles.value = [];
    return;
  }
  const files = await Promise.all(
    file.sourceFileIds.map(async (uuid) => {
      const res = await axios.get<FileResponse>(`${backendUrl}files/${uuid}`);
      return res.data;
    }),
  );
  files.sort((a, b) => {
    return compareValues(a.product.humanReadableName, b.product.humanReadableName);
  });
  sourceFiles.value = files;
}

async function openDeleteModal() {
  try {
    deleteBusy.value = true;
    const res = await axios.delete<File[]>(`${backendUrl}files/${props.uuid}`, {
      params: { dryRun: true, deleteHigherProducts: true },
      auth: { username: loginStore.username, password: loginStore.password },
    });
    showDeleteModal.value = true;
    filesToDelete.value = res.data;
  } catch (err) {
    const error = (axios.isAxiosError(err) && err.response?.data.errors) || "Unknown error";
    alert("Can't delete file: " + error);
  } finally {
    deleteBusy.value = false;
  }
}

async function deleteFile() {
  try {
    deleteBusy.value = true;
    await axios.delete(`${backendUrl}files/${props.uuid}`, {
      params: {
        dryRun: false,
        deleteHigherProducts: true,
        tombstoneReason: requireTombstoneReason.value ? tombstoneReason.value : undefined,
      },
      auth: { username: loginStore.username, password: loginStore.password },
    });
    window.location.reload();
  } catch (err) {
    const error = (axios.isAxiosError(err) && err.response?.data.errors) || "Unknown error";
    alert("Delete failed: " + error);
  } finally {
    deleteBusy.value = false;
  }
}

watch(
  () => props.uuid,
  async () => {
    try {
      isBusy.value = true;
      await fetchFileMetadata();
      if (file.value == null || error.value) return;
    } finally {
      isBusy.value = false;
    }
    visualizations.value = [];
    sourceFiles.value = [];
    if (!versions.value.includes(file.value.uuid)) {
      versions.value = [];
    }
    await Promise.all([fetchVisualizations(file.value), fetchVersions(file.value), fetchSourceFiles(file.value)]);
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
.banner-container-obsolete {
  background-color: $red6;
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
    $border-radius: 5px;

    display: flex;
    flex-direction: column;
    padding: 2rem;
    background-color: white;
    border-radius: $border-radius;
    box-shadow: 0 0.1em 0.6em 0 rgba(0, 0, 0, 0.15);
    block-size: 100%;
    position: relative;

    &.obsolete::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image: repeating-linear-gradient(-45deg, #faf5ef, #faf5ef 15px, white 15px, white 30px);
      opacity: 0.6;
      pointer-events: none;
      z-index: 100;
      border-radius: $border-radius;
    }
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
      margin: 0 -1rem;
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

.file-list {
  list-style: disc;
  padding: 0.5rem 0 0.5rem 1rem;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}
</style>
