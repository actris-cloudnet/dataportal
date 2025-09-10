<style scoped lang="scss">
.provenance {
  a {
    display: inline-flex;
    align-items: center;
  }

  .icon {
    width: 1.1rem;
    height: 1.1rem;
    line-height: 1.1rem;
    margin-right: 0.5rem;
    color: gray;
    text-align: center;
    font-size: 90%;
  }
}
</style>

<template>
  <div class="summary-section" id="data-origin">
    <div class="summary-section-header">Provenance</div>
    <dl class="summary-section-table provenance">
      <dt>Data sources</dt>
      <dd>
        <ul v-if="sourceFiles.length > 0">
          <li v-for="sourceFile in sourceFiles" :key="sourceFile.uuid">
            <router-link :to="{ name: 'File', params: { uuid: sourceFile.uuid } }">
              <img :alt="sourceFile.product.id" :src="getProductIcon(sourceFile.product.id)" class="icon" />
              <template v-if="'instrument' in sourceFile && sourceFile.instrument">
                {{ sourceFile.product.humanReadableName }}:
                {{ sourceFile.instrument.model }}
              </template>
              <template v-else-if="'model' in sourceFile">
                {{ sourceFile.product.humanReadableName }}:
                {{ sourceFile.model.humanReadableName }}
              </template>
              <template v-else>
                {{ sourceFile.product.humanReadableName }}
              </template>
            </router-link>
          </li>
        </ul>
        <router-link
          v-if="'instrument' in file && file.instrument"
          :to="{
            name: 'Raw Files',
            params: { uuid: file.instrument.uuid },
            query: { date: file.measurementDate },
          }"
        >
          <img :alt="`Raw files for ${file.instrument.id}`" :src="folderIcon" class="icon" />
          Raw files
        </router-link>
        <span v-if="!sourceFiles.length && !('instrument' in file && file.instrument)" class="notAvailable"></span>
      </dd>
      <dt>Versions</dt>
      <dd>
        <router-link v-if="!isBusy && previousVersion" id="previousVersion" :to="`/file/${previousVersion}`" replace>
          previous
        </router-link>
        <span v-if="!isBusy && previousVersion && nextVersion">-</span>
        <router-link v-if="!isBusy && nextVersion" id="nextVersion" :to="`/file/${nextVersion}`" replace>
          next
        </router-link>
        <span v-if="isBusy || (!previousVersion && !nextVersion)" class="notAvailable"></span>
      </dd>
      <dt>Software</dt>
      <dd v-if="file.software.length > 0">
        <ul class="software">
          <li v-for="software in file.software" :key="software.title">
            <a :href="software.url" v-if="software.url">
              {{ software.title }}
            </a>
            <span v-else>
              {{ software.title }}
            </span>
          </li>
        </ul>
      </dd>
      <dd v-else>
        <span class="notAvailable" />
      </dd>
      <template v-if="file.dvasId">
        <dt>External links</dt>
        <dd><a :href="`https://data.actris.eu/${file.dvasId}`" target="_blank">ACTRIS data portal</a></dd>
      </template>
    </dl>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { getProductIcon } from "@/lib";
import type { FileResponse } from "@/views/FileView.vue";
import folderIcon from "@/assets/icons/icons8-folder-48.png";

export interface Props {
  file: FileResponse;
  isBusy: boolean;
  versions: string[];
  sourceFiles: FileResponse[];
}

const props = defineProps<Props>();

const currentVersionIndex = computed(() => props.versions.findIndex((uuid) => uuid == props.file.uuid));

const previousVersion = computed(() => props.versions[currentVersionIndex.value + 1]);

const nextVersion = computed(() => props.versions[currentVersionIndex.value - 1]);
</script>
