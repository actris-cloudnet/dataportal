<template>
  <ApiError :response="(instruments.error as any).response" v-if="instruments.status === 'error'" />
  <div v-else>
    <LandingHeader title="Instruments" />
    <main class="pagewidth">
      <template v-if="instruments.status === 'ready'">
        <section v-if="myInstruments.length > 0" class="my-instruments">
          <h2>My instrument logs</h2>
          <div class="my-instruments-grid">
            <div v-for="site in myInstruments" :key="'my-' + site.id">
              <h3>{{ site.humanReadableName }}</h3>
              <ul class="my-instruments-list">
                <li v-for="instr in site.instruments" :key="instr.uuid">
                  <span :class="{ status: true, [instr.status]: true }"></span>
                  <router-link :to="{ name: 'InstrumentLogbook', params: { uuid: instr.uuid } }">
                    {{ instr.name }}
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </section>
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
import { computed, onMounted, ref } from "vue";
import axios from "axios";

import type { InstrumentInfo } from "@shared/entity/Instrument";
import type { Site } from "@shared/entity/Site";
import { backendUrl, compareValues } from "@/lib";
import { loginStore } from "@/lib/auth";
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

const myInstruments = computed(() => {
  if (instruments.value.status !== "ready") return [];
  const logPerms = loginStore.instrumentLogPermissions;
  if (logPerms.length === 0) return [];
  const isGlobal = logPerms.some((p) => p.instrumentInfoUuid === null);
  if (isGlobal) return instruments.value.value;
  const uuids = new Set(logPerms.map((p) => p.instrumentInfoUuid));
  return instruments.value.value
    .map((site) => ({
      ...site,
      instruments: site.instruments.filter((instr) => uuids.has(instr.uuid)),
    }))
    .filter((site) => site.instruments.length > 0);
});

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

.my-instruments {
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;

  h2 {
    margin-top: 0;
  }

  h3 {
    font-size: 110%;
    margin: 0.5rem 0;
  }
}

.my-instruments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
  gap: 1rem;
}

.my-instruments-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
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
