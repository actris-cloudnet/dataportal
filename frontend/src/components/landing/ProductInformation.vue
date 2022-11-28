<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
.summary-section-header-container
  display: flex
  flex-direction: row
  justify-content: space-between

.metadata-container
  font-size: 85%
  font-weight: 500

.error
  color: $RED-4-hex

.loading
  color: $GRAY-4-hex
</style>

<template>
  <div class="summary-section" id="product-information">
    <div class="summary-section-header-container">
      <div class="summary-section-header">Product</div>
      <div class="metadata-container"><a :href="jsonUrl">JSON</a></div>
    </div>
    <table class="summary-section-table">
      <tr>
        <th>Type</th>
        <td>
          <div class="product-container">
            <img :alt="response.product.id" :src="productIconUrl" class="product-icon" />
            {{ response.product.humanReadableName }}
          </div>
        </td>
      </tr>
      <tr>
        <th>Level</th>
        <td>
          {{ response.product.level }}
          (<a :href="'https://docs.cloudnet.fmi.fi/levels.html#level-' + response.product.level">definition</a>)
        </td>
      </tr>
      <tr v-if="response.instrumentPid">
        <th>Instrument</th>
        <td>
          <span v-if="instrumentStatus === 'loading'" class="loading">Loading...</span>
          <a v-else-if="instrumentStatus === 'error'" :href="response.instrumentPid" class="error">
            Failed to load information
          </a>
          <a v-else :href="response.instrumentPid">{{ instrument }}</a>
        </td>
      </tr>
      <tr v-if="response.model">
        <th>Model</th>
        <td>{{ response.model.humanReadableName }}</td>
      </tr>
      <tr>
        <th>Timeliness</th>
        <td>{{ timelinessString }}</td>
      </tr>
      <tr>
        <th>Quality control</th>
        <td>
          <div v-if="typeof response.errorLevel === 'string'" class="quality-container">
            <img class="quality-icon" :src="getQcIcon(response.errorLevel)" alt="" />
            <span v-if="response.errorLevel !== 'pass'">
              {{getQcText(response.errorLevel)}}<router-link :to=getQcLink(response.uuid)>see report.</router-link></span>
            <span v-else>
              Pass</span>
          </div>
          <span v-else class="notAvailable"> </span>
        </td>
      </tr>
      <tr>
        <th>Measurement date</th>
        <td>{{ response.measurementDate }}</td>
      </tr>
      <tr>
        <th>Location</th>
        <td>
          <router-link :to="`/site/${response.site.id}`">
            {{ response.site.humanReadableName }},
            {{ response.site.country }}
          </router-link>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";
import {getProductIcon, getQcIcon, getQcLink, getQcText} from "../../lib";

@Component
export default class ProductInformation extends Vue {
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() instrument!: string | null;
  @Prop() instrumentStatus!: "loading" | "error" | "ready";
  getQcIcon = getQcIcon;
  getQcText = getQcText;
  getQcLink = getQcLink;
  get timelinessString() {
    if (this.response == null) {
      return "";
    }
    return this.response.quality === "qc" ? "Quality Controlled (QC)" : "Near Real Time (NRT)";
  }
  get productIconUrl() {
    return this.response !== null ? getProductIcon(this.response.product.id) : null;
  }
  get jsonUrl(): string {
    if (!this.response) return "";
    return `${process.env.VUE_APP_BACKENDURL}files/${this.response.uuid}`;
  }
}
</script>
