<template>
  <div v-if="instrumentPid.status === 'ready'">
    <LandingHeader :title="instrumentPid.value.name" :subtitle="instrumentPid.value.instrument.humanReadableName" />
    <main class="pagewidth">
      <h2>Instrument</h2>
      <dl>
        <dt>PID</dt>
        <dd>
          <a :href="instrumentPid.value.pid">{{ instrumentPid.value.pid }}</a>
        </dd>
        <dt>{{ instrumentPid.value.owners.length === 1 ? "Owner" : "Owners" }}</dt>
        <dd>
          <ul>
            <li v-for="owner in instrumentPid.value.owners" :key="owner">{{ owner }}</li>
          </ul>
        </dd>
        <dt>Model</dt>
        <dd>{{ instrumentPid.value.model }}</dd>
        <dt>Type</dt>
        <dd>{{ instrumentPid.value.type }}</dd>
        <template v-if="instrumentPid.value.serialNumber">
          <dt>Serial number</dt>
          <dd>{{ instrumentPid.value.serialNumber }}</dd>
        </template>
      </dl>
      <template v-if="instrumentPid.value.locations.length > 0">
        <h2>Locations</h2>
        <table class="locations">
          <tr v-for="location in instrumentPid.value.locations" :key="location.siteId">
            <td>{{ location.startDate }}</td>
            <td>–</td>
            <td>{{ location.endDate >= yesterdayString ? "now" : location.endDate }}</td>
            <td>
              <router-link :to="{ name: 'Site', params: { siteId: location.siteId } }">
                {{ location.humanReadableName }}
              </router-link>
            </td>
          </tr>
        </table>
      </template>
      <template v-if="dataStatus && dataStatus.availableProducts.length > 0">
        <h2>Products</h2>
        <InstrumentVisualization :dataStatus="dataStatus" />
      </template>
    </main>
  </div>
  <ApiError :response="(instrumentPid.error as any).response" v-else-if="instrumentPid.status === 'error'" />
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import axios from "axios";

import type { InstrumentInfo } from "@shared/entity/Instrument";
import { backendUrl, dateToString } from "@/lib";
import LandingHeader from "@/components/LandingHeader.vue";
import ApiError from "@/views/ApiError.vue";
import { parseDataStatus, type DataStatus } from "@/lib/DataStatusParser";
import InstrumentVisualization from "@/components/InstrumentVisualization.vue";

export interface Props {
  uuid: string;
}

const props = defineProps<Props>();

type InstrumentPidResult =
  | { status: "loading" }
  | { status: "ready"; value: InstrumentInfo }
  | { status: "error"; error: Error };

const instrumentPid = ref<InstrumentPidResult>({ status: "loading" });

const dataStatus = ref<DataStatus>();

const yesterday = new Date();
yesterday.setUTCDate(yesterday.getUTCDate() - 1);
const yesterdayString = dateToString(yesterday);

onMounted(async () => {
  try {
    const res = await axios.get<InstrumentInfo>(`${backendUrl}instrument-pids/${props.uuid}`);
    dataStatus.value = await parseDataStatus({ instrumentPid: res.data.pid });
    instrumentPid.value = { status: "ready", value: res.data };
  } catch (error) {
    instrumentPid.value = { status: "error", error: error as Error };
  }
});
</script>

<style scoped lang="scss">
h2 {
  margin-top: 1rem;
  margin-bottom: 1rem;
  font-size: 130%;
  font-weight: 400;
}

dl {
  display: grid;
  grid-template-columns: minmax(min-content, 10rem) auto;
  row-gap: 0.4rem;
}

dt {
  font-weight: 500;
}

.locations {
  border-spacing: 0px 4px;

  td:nth-child(1),
  td:nth-child(3) {
    font-variant: tabular-nums;
    font-size: 90%;
    color: #555;
  }

  td:nth-child(2) {
    padding: 0 0.5rem;
  }

  td:nth-child(3) {
    padding-right: 1rem;
  }
}
</style>
