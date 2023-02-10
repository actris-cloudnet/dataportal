<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="summary-section" id="data-origin">
    <div class="summary-section-header">Origin</div>
    <table class="summary-section-table">
      <tr>
        <th>Data sources</th>
        <td v-if="sourceFiles.length > 0">
          <div class="data-source-list">
            <!-- eslint-disable-next-line vue/require-v-for-key -->
            <div
              class="data-source-container"
              v-for="sourceFile in sourceFiles"
            >
              <router-link
                :to="`/file/${sourceFile.value.uuid}`"
                v-if="sourceFile.ok"
              >
                <img
                  :alt="sourceFile.value.product.id"
                  :src="getProductIcon(sourceFile.value.product.id)"
                  class="product-icon"
                />
                {{ sourceFile.value.product.humanReadableName }}
              </router-link>
              <a v-else>
                <span class="product-icon">?</span>
                Unknown file
              </a>
            </div>
          </div>
        </td>
        <td v-else>
          <span class="notAvailable" />
        </td>
      </tr>
      <tr>
        <th>Versions</th>
        <td>
          <router-link
            v-if="!isBusy && previousVersion"
            id="previousVersion"
            :to="`/file/${previousVersion}`"
            replace
          >
            previous
          </router-link>
          <span v-if="!isBusy && previousVersion && nextVersion">-</span>
          <router-link
            v-if="!isBusy && nextVersion"
            id="nextVersion"
            :to="`/file/${nextVersion}`"
            replace
          >
            next</router-link
          >
          <span
            v-if="isBusy || (!previousVersion && !nextVersion)"
            class="notAvailable"
          ></span>
        </td>
      </tr>
      <tr>
        <th>Software</th>
        <td
          v-if="response.processingVersion || 'cloudnetpyVersion' in response"
        >
          <span v-if="response.processingVersion">
            <a
              :href="`https://github.com/actris-cloudnet/cloudnet-processing/tree/v${response.processingVersion}`"
            >
              Cloudnet processing {{ response.processingVersion }}
            </a>
          </span>
          <span
            v-if="response.processingVersion && 'cloudnetpyVersion' in response"
          >
            <br />
          </span>
          <span v-if="'cloudnetpyVersion' in response">
            <template
              v-if="response.cloudnetpyVersion.toLowerCase().includes('custom')"
            >
              {{ response.cloudnetpyVersion }}
            </template>
            <a
              v-else
              :href="`https://github.com/actris-cloudnet/cloudnetpy/tree/v${response.cloudnetpyVersion}`"
            >
              CloudnetPy {{ response.cloudnetpyVersion }}
            </a>
          </span>
        </td>
        <td v-else>
          <span class="notAvailable" />
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { getProductIcon } from "../../lib";
import type { FileResponse, SourceFile } from "@/views/FileView.vue";

export interface Props {
  response: FileResponse;
  isBusy: boolean;
  versions: string[];
  sourceFiles: SourceFile[];
}

const props = defineProps<Props>();

const currentVersionIndex = computed(() =>
  props.versions.findIndex((uuid) => uuid == props.response.uuid)
);

const previousVersion = computed(
  () => props.versions[currentVersionIndex.value + 1]
);

const nextVersion = computed(
  () => props.versions[currentVersionIndex.value - 1]
);
</script>
