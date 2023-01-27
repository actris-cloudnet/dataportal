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
            <div class="data-source-container" v-for="sourceFile in sourceFiles">
              <router-link :to="`/file/${sourceFile.value.uuid}`" v-if="sourceFile.ok">
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
          <router-link v-if="!isBusy && previousVersion" id="previousVersion" :to="`/file/${previousVersion}`" replace>
            previous
          </router-link>
          <span v-if="!isBusy && previousVersion && nextVersion">-</span>
          <router-link v-if="!isBusy && nextVersion" id="nextVersion" :to="`/file/${nextVersion}`" replace>
            next</router-link
          >
          <span v-if="isBusy || (!previousVersion && !nextVersion)" class="notAvailable"></span>
        </td>
      </tr>
      <tr>
        <th>Software</th>
        <td v-if="response.processingVersion && response.cloudnetpyVersion">
          <span v-if="response.processingVersion">
            <a :href="`https://github.com/actris-cloudnet/cloudnet-processing/tree/v${response.processingVersion}`">
              Cloudnet processing {{ response.processingVersion }}
            </a>
          </span>
          <span v-if="response.processingVersion && response.cloudnetpyVersion">
            <br />
          </span>
          <span v-if="response.cloudnetpyVersion">
            <template v-if="response.cloudnetpyVersion.indexOf('ustom') !== -1">
              {{ response.cloudnetpyVersion }}
            </template>
            <a v-else :href="`https://github.com/actris-cloudnet/cloudnetpy/tree/v${response.cloudnetpyVersion}`">
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

<script lang="ts">
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";
import { getProductIcon } from "../../lib";
import { SourceFile } from "../../views/File.vue";

@Component
export default class DataOrigin extends Vue {
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() isBusy!: boolean;
  @Prop() versions!: string[];
  @Prop() sourceFiles!: SourceFile[];
  getProductIcon = getProductIcon;

  get currentVersionIndex() {
    if (this.response == null) return null;
    const response = this.response;
    return this.versions.findIndex((uuid) => uuid == response.uuid);
  }

  get previousVersion() {
    if (this.currentVersionIndex == null) return null;
    return this.versions[this.currentVersionIndex + 1];
  }

  get nextVersion() {
    if (!this.currentVersionIndex) return null;
    return this.versions[this.currentVersionIndex - 1];
  }
}
</script>
