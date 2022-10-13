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
            <div class="data-source-container" v-for="sourceFile in sourceFiles" :key="sourceFile.uuid">
              <router-link :to="`/beta/file/${sourceFile.uuid}`">
                <img :alt="sourceFile.product.id" :src="getProductIcon(sourceFile.product.id)" class="product-icon" />
                {{ sourceFile.product.humanReadableName }}
              </router-link>
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
            :to="`/beta/file/${previousVersion}`"
            replace
          >
            previous
          </router-link>
          <span v-if="!isBusy && previousVersion && nextVersion">-</span>
          <router-link v-if="!isBusy && nextVersion" id="nextVersion" :to="`/beta/file/${nextVersion}`" replace>
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
              Cloudnet-processing {{ response.processingVersion }}
            </a>
          </span>
          <span v-if="response.processingVersion && response.cloudnetpyVersion">
            <br />
          </span>
          <span v-if="response.cloudnetpyVersion">
            <a :href="`https://github.com/actris-cloudnet/cloudnetpy/tree/v${response.cloudnetpyVersion}`">
              Cloudnetpy {{ response.cloudnetpyVersion }}
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

@Component
export default class DataOrigin extends Vue {
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() isBusy!: boolean;
  @Prop() versions!: string[];
  @Prop() sourceFiles!: RegularFile[];
  getProductIcon = getProductIcon;

  get currentVersionIndex() {
    if (this.response == null) return null;
    const response = this.response;
    return this.versions.findIndex((uuid) => uuid == response.uuid);
  }

  get newestVersion() {
    if (!this.currentVersionIndex) return null;
    return this.versions[0];
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
