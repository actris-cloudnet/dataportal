<template>
  <div class="summary-section" id="product-information">
    <div class="summary-section-header-container">
      <div class="summary-section-header">Product</div>
      <div class="metadata-container"><a :href="jsonUrl">JSON</a></div>
    </div>
    <dl class="summary-section-table">
      <dt>Type</dt>
      <dd>
        <router-link :to="{ name: 'Product', params: { product: file.product.id } }" class="product-container">
          <img :alt="file.product.id" :src="productIconUrl" class="product-icon" />
          {{ file.product.humanReadableName }}
        </router-link>
      </dd>
      <template v-if="'instrumentPid' in file && file.instrumentPid">
        <dt>Instrument</dt>
        <dd>
          <router-link
            v-if="file.instrumentInfo"
            :to="{ name: 'Instrument', params: { uuid: file.instrumentInfo.uuid } }"
          >
            {{ file.instrumentInfo.name }}
            {{ file.instrumentInfo.type }}
          </router-link>
          <a v-else :href="file.instrumentPid">{{ file.instrumentPid }}</a>
        </dd>
      </template>
      <template v-if="'model' in file">
        <dt>Model</dt>
        <dd>{{ file.model.humanReadableName }}</dd>
      </template>
      <dt>Timeliness</dt>
      <dd>
        <a :href="timelinessDisplay[file.timeliness].url" target="_blank">
          {{ timelinessDisplay[file.timeliness].label }}
        </a>
      </dd>
      <dt>Start time</dt>
      <dd v-if="file.startTime">{{ humanReadableTimestamp(file.startTime) }}</dd>
      <dd v-else>
        <span class="notAvailable" />
      </dd>
      <dt>Stop time</dt>
      <dd v-if="file.stopTime">{{ humanReadableTimestamp(file.stopTime) }}</dd>
      <dd v-else>
        <span class="notAvailable" />
      </dd>
      <template v-if="!file.startTime && !file.stopTime">
        <dt>Date</dt>
        <dd>{{ file.measurementDate }}</dd>
      </template>
      <dt>Location</dt>
      <dd>
        <router-link :to="{ name: 'Site', params: { siteId: file.site.id } }">
          {{ file.site.humanReadableName }}<template v-if="file.site.country">, {{ file.site.country }}</template>
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
  file: FileResponse;
  location: SiteLocation | null;
}

const props = defineProps<Props>();

const timelinessDisplay: Record<Timeliness, { label: string; url: string }> = {
  rrt: { label: "Real real-time (RRT)", url: "https://vocabulary.actris.nilu.no/actris_vocab/realreal-time" },
  nrt: { label: "Near real-time (NRT)", url: "https://vocabulary.actris.nilu.no/actris_vocab/nearreal-time" },
  scheduled: { label: "Scheduled", url: "https://vocabulary.actris.nilu.no/actris_vocab/scheduled" },
};

const productIconUrl = computed(() => getProductIcon(props.file.product.id));

const jsonUrl = computed(() => `${backendUrl}files/${props.file.uuid}`);
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

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
  color: variables.$red4;
}

.loading {
  color: variables.$gray4;
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
