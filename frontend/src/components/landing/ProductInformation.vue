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

.coordinates
  font-size: 90%
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
            <img
              :alt="response.product.id"
              :src="productIconUrl"
              class="product-icon"
            />
            {{ response.product.humanReadableName }}
          </div>
        </td>
      </tr>
      <tr>
        <th>Level</th>
        <td>
          {{ response.product.level }}
          (<a
            :href="
              'https://docs.cloudnet.fmi.fi/levels.html#level-' +
              response.product.level
            "
            >definition</a
          >)
        </td>
      </tr>
      <tr v-if="'instrumentPid' in response && instrument">
        <th>Instrument</th>
        <td>
          <span v-if="instrumentStatus === 'loading'" class="loading"
            >Loading...</span
          >
          <a
            v-else-if="instrumentStatus === 'error'"
            :href="response.instrumentPid"
            class="error"
          >
            Failed to load information
          </a>
          <a v-else :href="response.instrumentPid">{{ instrument }}</a>
        </td>
      </tr>
      <tr v-if="'model' in response">
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
          <div
            v-if="typeof response.errorLevel === 'string'"
            class="quality-container"
          >
            <img
              class="quality-icon"
              :src="getQcIcon(response.errorLevel)"
              alt=""
            />
            <span v-if="response.errorLevel !== 'pass'">
              {{ getQcText(response.errorLevel) }}
              <router-link :to="getQcLink(response.uuid)"
                >see report.</router-link
              >
            </span>
            <span v-else> Pass</span>
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
            {{ response.site.humanReadableName
            }}<template v-if="response.site.country"
              >, {{ response.site.country }}</template
            >
          </router-link>
          <template v-if="location">
            <span class="coordinates">
              ({{ formatCoordinates(location.latitude, location.longitude) }})
            </span>
          </template>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts" setup>
import type { FileResponse } from "@/views/FileView.vue";
import type { SiteLocation } from "@shared/entity/SiteLocation";
import { computed } from "vue";
import {
  getProductIcon,
  getQcIcon,
  getQcLink,
  getQcText,
  formatCoordinates,
} from "../../lib";

export interface Props {
  response: FileResponse;
  location: SiteLocation | null;
  instrument: string | null;
  instrumentStatus: "loading" | "error" | "ready";
}

const props = defineProps<Props>();

const timelinessString = computed(() =>
  props.response.quality === "qc"
    ? "Quality Controlled (QC)"
    : "Near Real Time (NRT)"
);

const productIconUrl = computed(() =>
  getProductIcon(props.response.product.id)
);

const jsonUrl = computed(
  () => `${import.meta.env.VITE_BACKEND_URL}files/${props.response.uuid}`
);
</script>
