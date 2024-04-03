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
          <router-link
            v-if="response.instrumentInfo"
            :to="{ name: 'Instrument', params: { uuid: response.instrumentInfo.uuid } }"
          >
            {{ response.instrumentInfo.name }}
            {{ response.instrumentInfo.type }}
          </router-link>
          <a v-else :href="response.instrumentPid">{{ response.instrumentPid }}</a>
        </dd>
      </template>
      <template v-if="'model' in response">
        <dt>Model</dt>
        <dd>{{ response.model.humanReadableName }}</dd>
      </template>
      <dt>Timeliness</dt>
      <dd>
        <a :href="timelinessDisplay[response.timeliness].url" target="_blank">
          {{ timelinessDisplay[response.timeliness].label }}
        </a>
      </dd>
      <dt>Start time</dt>
      <dd v-if="response.startTime">{{ humanReadableTimestamp(response.startTime) }}</dd>
      <dd v-else>
        <span class="notAvailable" />
      </dd>
      <dt>Stop time</dt>
      <dd v-if="response.stopTime">{{ humanReadableTimestamp(response.stopTime) }}</dd>
      <dd v-else>
        <span class="notAvailable" />
      </dd>
      <template v-if="!response.startTime && !response.stopTime">
        <dt>Date</dt>
        <dd>{{ response.measurementDate }}</dd>
      </template>
      <dt>Location</dt>
      <dd>
        <router-link :to="{ name: 'Site', params: { siteId: response.site.id } }">
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
import { getProductIcon, formatCoordinates, backendUrl, humanReadableTimestamp } from "@/lib";
import type { Timeliness } from "@shared/entity/File";

export interface Props {
  response: FileResponse;
  location: SiteLocation | null;
}

const props = defineProps<Props>();

const timelinessDisplay: Record<Timeliness, { label: string; url: string }> = {
  rrt: { label: "Real real-time (RRT)", url: "https://vocabulary.actris.nilu.no/actris_vocab/realreal-time" },
  nrt: { label: "Near real-time (NRT)", url: "https://vocabulary.actris.nilu.no/actris_vocab/nearreal-time" },
  scheduled: { label: "Scheduled", url: "https://vocabulary.actris.nilu.no/actris_vocab/scheduled" },
};

const productIconUrl = computed(() => getProductIcon(props.response.product.id));

const jsonUrl = computed(() => `${backendUrl}files/${props.response.uuid}`);
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
