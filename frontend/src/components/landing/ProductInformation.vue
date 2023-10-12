<template>
  <div class="summary-section" id="product-information">
    <div class="summary-section-header-container">
      <div class="summary-section-header">Product</div>
      <div class="metadata-container"><a :href="jsonUrl">JSON</a></div>
    </div>
    <dl class="summary-section-table">
      <dt>Type</dt>
      <dd>
        <div class="product-container">
          <img :alt="response.product.id" :src="productIconUrl" class="product-icon" />
          {{ response.product.humanReadableName }}
        </div>
      </dd>
      <template v-if="'instrumentPid' in response && response.instrumentPid">
        <dt>Instrument</dt>
        <dd>
          <span v-if="instrumentStatus === 'loading'" class="loading"> Loading... </span>
          <a v-else-if="instrumentStatus === 'error'" :href="response.instrumentPid" class="error">
            Failed to load information
          </a>
          <a v-else :href="response.instrumentPid">{{ instrument }}</a>
        </dd>
      </template>
      <template v-if="'model' in response">
        <dt>Model</dt>
        <dd>{{ response.model.humanReadableName }}</dd>
      </template>
      <dt>Timeliness</dt>
      <dd>{{ timelinessString }}</dd>
      <dt>Measurement date</dt>
      <dd>{{ response.measurementDate }}</dd>
      <dt>Location</dt>
      <dd>
        <router-link :to="{ name: 'Site', params: { siteid: response.site.id } }">
          {{ response.site.humanReadableName
          }}<template v-if="response.site.country">, {{ response.site.country }}</template>
        </router-link>
        <span class="coordinates" v-if="location">
          ({{ formatCoordinates(location.latitude, location.longitude) }})
        </span>
      </dd>
    </dl>
  </div>
</template>

<script lang="ts" setup>
import type { FileResponse } from "@/views/FileView.vue";
import type { SiteLocation } from "@shared/entity/SiteLocation";
import { computed } from "vue";
import { getProductIcon, formatCoordinates } from "@/lib";

export interface Props {
  response: FileResponse;
  location: SiteLocation | null;
  instrument: string | null;
  instrumentStatus: "loading" | "error" | "ready";
}

const props = defineProps<Props>();

const timelinessString = computed(() =>
  props.response.quality === "qc" ? "Quality Controlled (QC)" : "Near Real Time (NRT)",
);

const productIconUrl = computed(() => getProductIcon(props.response.product.id));

const jsonUrl = computed(() => `${import.meta.env.VITE_BACKEND_URL}files/${props.response.uuid}`);
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

.summary-section-header-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.metadata-container {
  font-size: 85%;
  font-weight: 500;
}

.error {
  color: $red4;
}

.loading {
  color: $gray4;
}

.coordinates {
  font-size: 90%;
}

.product-container {
  display: flex;
  align-items: center;
}

.product-icon {
  height: 1.1rem;
  margin-right: 0.5rem;
}
</style>
