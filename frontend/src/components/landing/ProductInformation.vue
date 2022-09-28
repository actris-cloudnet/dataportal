<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="summary-section" id="product-information">
    <div class="summary-section-header">Product</div>
    <table class="summary-section-table">
      <tr>
        <th>Product</th>
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
          <a :href="response.instrumentPid">{{ instrument }}</a>
        </td>
      </tr>
      <tr v-if="model">
        <th>Model</th>
        <td>
          {{ model.id }}
        </td>
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
            <span v-if="response.errorLevel !== 'pass'"> See quality report </span>
            <span v-else> Pass </span>
          </div>
          <span v-else class="notAvailable"> </span>
        </td>
      </tr>
      <tr>
        <th>Site</th>
        <td>
          <router-link :to="`/site/${response.site.id}`">
            {{ response.site.humanReadableName }}
          </router-link>
        </td>
      </tr>
      <tr>
        <th>Measured</th>
        <td>{{ response.measurementDate }}</td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { Model } from "../../../../backend/src/entity/Model";
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";
import { getProductIcon, getQcIcon } from "../../lib";

@Component
export default class ProductInformation extends Vue {
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() instrument!: string | null;
  @Prop() model!: Model | null;
  getQcIcon = getQcIcon;
  get timelinessString() {
    if (this.response == null) {
      return "";
    }
    return this.response.quality === "qc" ? "Quality Controlled (QC)" : "Near Real Time (NRT)";
  }
  get productIconUrl() {
    return this.response !== null ? getProductIcon(this.response.product.id) : null;
  }
}
</script>
