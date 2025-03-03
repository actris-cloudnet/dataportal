<template>
  <ApiError :response="(instruments.error as any).response" v-if="instruments.status === 'error'" />
  <div v-else>
    <LandingHeader title="Instruments" />
    <main class="pagewidth">
      <template v-if="instruments.status === 'ready'">
        <div class="site" v-for="site in instruments.value" :key="site.id">
          <h2>{{ site.humanReadableName }}</h2>
          <ul>
            <li v-for="instrument in site.instruments" :key="instrument.uuid" class="instrument">
              <span :class="{ status: true, [instrument.status]: true }"></span>
              <router-link :to="{ name: 'Instrument', params: { uuid: instrument.uuid } }" class="name">
                {{ instrument.name }}
              </router-link>
              <div class="type">
                {{ instrument.type }}
              </div>
            </li>
          </ul>
        </div>
        <p class="legend">
          <span class="status active"></span>
          Data within 3 days
          <span class="status recent"></span>
          Data within 7 days
          <span class="status inactive"></span>
          No recent data
        </p>
      </template>
      <BaseSpinner v-else />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import axios from "axios";

import type { InstrumentInfo } from "@shared/entity/Instrument";
import type { Site } from "@shared/entity/Site";
import { backendUrl, compareValues } from "@/lib";
import LandingHeader from "@/components/LandingHeader.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";
import ApiError from "@/views/ApiError.vue";

interface SiteWithInstruments {
  id: string;
  humanReadableName: string;
  instruments: InstrumentInfo[];
}
type ProductResult =
  | { status: "loading" }
  | { status: "ready"; value: SiteWithInstruments[] }
  | { status: "error"; error: Error };

const instruments = ref<ProductResult>({ status: "loading" });

function sortInstrument(a: InstrumentInfo, b: InstrumentInfo) {
  if (a.status == b.status) {
    return compareValues(a.name, b.name);
  }
  const statusOrder = ["active", "recent", "inactive"];
  return compareValues(statusOrder.indexOf(a.status), statusOrder.indexOf(b.status));
}

onMounted(async () => {
  try {
    const [siteRes, instruRes] = await Promise.all([
      axios.get<Site[]>(`${backendUrl}sites`),
      axios.get<InstrumentInfo[]>(`${backendUrl}instrument-pids`, { params: { includeSite: 1 } }),
    ]);
    const sites = [
      ...siteRes.data,
      {
        id: "null",
        humanReadableName: "Graveyard",
      },
    ];
    const instruBySite = instruRes.data
      .sort(sortInstrument)
      .reduce((obj: Record<InstrumentInfo["siteId"], InstrumentInfo[]>, instrument) => {
        if (!(instrument.siteId in obj)) {
          obj[instrument.siteId] = [];
        }
        obj[instrument.siteId].push(instrument);
        return obj;
      }, {});
    instruments.value = {
      status: "ready",
      value: sites.map((site) => ({ ...site, instruments: instruBySite[site.id] })).filter((site) => site.instruments),
    };
  } catch (error) {
    instruments.value = { status: "error", error: error as Error };
  }
});
</script>

<style scoped lang="scss">
h2 {
  font-size: 150%;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.site {
  margin-bottom: 2rem;
}

ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
  gap: 1rem;
}

.instrument {
  display: grid;
  grid-template-columns: min-content auto;
  column-gap: 0.25rem;

  .type {
    grid-column: 2 / 3;
  }
}

.status {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  align-self: center;

  &.active {
    background: #25910f;
  }

  &.recent {
    background: #eed679;
  }

  &.inactive {
    background: #ddd;
  }
}

.legend {
  font-size: 75%;
  margin-top: 1rem;
  color: #666;
  border-top: 1px solid #ddd;
  padding-top: 0.5rem;
  padding-bottom: 1rem;
  display: inline-block;

  .status:not(:first-child) {
    margin-left: 8px;
  }
}
</style>
