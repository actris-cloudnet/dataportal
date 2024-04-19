<style scoped lang="scss">
.data-sources {
  a {
    display: inline-flex;
    align-items: center;
  }

  img {
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
    <dl class="summary-section-table">
      <dt>Data sources</dt>
      <dd v-if="sourceFiles.length > 0">
        <ul class="data-sources">
          <li v-for="sourceFile in sourceFiles" :key="sourceFile.uuid">
            <router-link :to="`/file/${sourceFile.value.uuid}`" v-if="sourceFile.ok">
              <img
                :alt="sourceFile.value.product.id"
                :src="getProductIcon(sourceFile.value.product.id)"
                class="product-icon"
              />
              {{ sourceFile.value.product.humanReadableName }}
              <template v-if="'instrumentInfo' in sourceFile.value && sourceFile.value.instrumentInfo">
                ({{ sourceFile.value.instrumentInfo.model }})
              </template>
              <template v-else-if="'model' in sourceFile.value">
                ({{ sourceFile.value.model.humanReadableName }})
              </template>
            </router-link>
            <a v-else>
              <span class="product-icon">?</span>
              Unknown file
            </a>
          </li>
        </ul>
      </dd>
      <dd class="notAvailable" v-else></dd>
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
      <dd v-if="response.software.length > 0">
        <ul class="software">
          <li v-for="software in response.software" :key="software.title">
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
    </dl>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { getProductIcon } from "@/lib";
import type { FileResponse, SourceFile } from "@/views/FileView.vue";

export interface Props {
  response: FileResponse;
  isBusy: boolean;
  versions: string[];
  sourceFiles: SourceFile[];
}

const props = defineProps<Props>();

const currentVersionIndex = computed(() => props.versions.findIndex((uuid) => uuid == props.response.uuid));

const previousVersion = computed(() => props.versions[currentVersionIndex.value + 1]);

const nextVersion = computed(() => props.versions[currentVersionIndex.value - 1]);
</script>
