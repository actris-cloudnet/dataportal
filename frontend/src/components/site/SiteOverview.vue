<template>
  <main class="pagewidth">
    <div class="new-layout">
      <section class="description">
        <div v-html="site.description" v-if="site.description"></div>
        <div v-else class="detailslistNotAvailable">Site description is missing.</div>
        <h2>Instruments</h2>
        <BaseSpinner v-if="instrumentsStatus === 'loading'" />
        <div v-else-if="instrumentsStatus === 'error'" class="detailslistError">
          Failed to load instrument information.
        </div>
        <div v-else-if="instruments && instruments.length" class="detailslist">
          <div>
            The site has submitted data from the following instruments in the last
            {{ instrumentsFromLastDays }} days:
          </div>
          <div v-for="(instrument, index) in instruments" :key="index" class="detailslistItem">
            <img alt="instrument icon" :src="instrument.icon" class="product" />
            <span v-if="instrument.to">
              <router-link :to="instrument.to">{{ instrument.name }}</router-link>
            </span>
            <span v-else>{{ instrument.name }}</span>
          </div>
        </div>
        <div v-else class="detailslistNotAvailable">
          No data received in the last {{ instrumentsFromLastDays }} days.
        </div>
      </section>
      <aside>
        <section id="sitemap" v-if="site.type.includes('mobile' as SiteType)">
          <BaseSpinner v-if="locations.status === 'loading'" />
          <TrackMap v-else-if="locations.status === 'ready'" :site="site.id" :track="locations.value" />
          <div v-else-if="locations.status === 'notFound'" style="padding: 10px; color: gray">No location history.</div>
          <div v-else-if="locations.status === 'error'" style="padding: 10px; color: red">
            Failed to load location history.
          </div>
        </section>
        <section id="sitemap" v-else-if="site.latitude != null && site.longitude != null">
          <MyMap
            v-if="!busy"
            :sites="[site]"
            :center="[site.latitude, site.longitude]"
            :zoom="5"
            :fullHeight="true"
            :key="mapKey"
          />
          <BaseSpinner v-else />
        </section>
        <section class="details">
          <dl>
            <template v-if="site.latitude != null && site.longitude != null">
              <dt>Coordinates</dt>
              <dd>
                {{ formatCoordinates(site.latitude, site.longitude) }}
              </dd>
            </template>
            <template v-if="site.altitude != null">
              <dt>Altitude</dt>
              <dd>{{ site.altitude }} <abbr title="meters above mean sea level">m a.s.l.</abbr></dd>
            </template>
            <dt>GAW ID</dt>
            <dd v-if="site.gaw">
              <a
                :href="`https://gawsis.meteoswiss.ch/GAWSIS/#/search/station/stationReportDetails/0-20008-0-${site.gaw}`"
              >
                {{ site.gaw }}
              </a>
            </dd>
            <dd class="notAvailable" v-else></dd>
            <dt>ACTRIS NF</dt>
            <dd v-if="nfName" style="max-width: 300px">
              <a :href="nfLink">{{ nfName }}</a>
            </dd>
            <dd class="notAvailable" v-else></dd>
          </dl>
        </section>
      </aside>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import axios from "axios";
import type { Site, SiteType } from "@shared/entity/Site";
import MyMap from "@/components/SuperMap.vue";
import { formatCoordinates, actrisNfUrl, getInstrumentIcon, backendUrl } from "@/lib";
import type { ReducedMetadataResponse } from "@shared/entity/ReducedMetadataResponse";
import TrackMap, { type Point } from "@/components/TrackMap.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";
import type { RouteLocationRaw } from "vue-router";

interface Instrument {
  to: RouteLocationRaw | null;
  name: string;
  icon: string;
}

type LocationsResult =
  | { status: "loading" }
  | { status: "ready"; value: Point[] }
  | { status: "notFound" }
  | { status: "error"; error: Error };

export interface Props {
  site: Site;
}

const props = defineProps<Props>();

const instruments = ref<Instrument[]>([]);
const instrumentsFromLastDays = 30;
const instrumentsStatus = ref<"loading" | "error" | "ready">("loading");
const mapKey = ref(0);
const busy = ref(false);
const nfName = ref<string>();
const nfLink = ref<string>();
const locations = ref<LocationsResult>({ status: "loading" });

onMounted(() => {
  if (props.site.type.includes("mobile" as SiteType)) {
    axios
      .get(`${backendUrl}sites/${props.site.id}/locations`)
      .then((res) => {
        if (res.data.length > 0) {
          locations.value = { status: "ready", value: res.data };
        } else {
          locations.value = { status: "notFound" };
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          locations.value = { status: "notFound" };
        } else {
          locations.value = { status: "error", error };
          console.error("Failed to load locations", error);
        }
      });
  } else {
    locations.value = { status: "notFound" };
  }
  loadInstruments().catch((error) => {
    console.error(error);
    instrumentsStatus.value = "error";
  });
});

watch(
  () => props.site,
  () => {
    if (!props.site?.actrisId) {
      return;
    }
    const apiUrl = `${actrisNfUrl}/api/facilities/${props.site.actrisId}`;
    axios
      .get(apiUrl)
      .then(({ data }) => {
        nfName.value = data.name;
        nfLink.value = data.landing_page;
      })
      .catch((error) => {
        console.error(error);
      });
  },
  { immediate: true },
);

function handleInstrument(response: ReducedMetadataResponse): Instrument {
  // TODO: Should be always available...
  if (response.instrumentInfo) {
    return {
      to: { name: "Instrument", params: { uuid: response.instrumentInfo.uuid } },
      name: `${response.instrumentInfo.name} ${response.instrumentInfo.type}`,
      icon: getInstrumentIcon(response.instrument),
    };
  } else {
    return {
      to: null,
      name: `Unidentified ${response.instrument.humanReadableName}`,
      icon: getInstrumentIcon(response.instrument),
    };
  }
}

async function loadInstruments() {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - instrumentsFromLastDays);
  const res = await axios.get(`${backendUrl}uploaded-metadata/`, {
    params: {
      site: props.site.id,
      updatedAtFrom: dateFrom,
      status: ["uploaded", "processed"],
    },
  });
  instruments.value = res.data.map(handleInstrument);
  instrumentsStatus.value = "ready";
}
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

img.product {
  height: auto;
  width: 1em;
  margin-right: 0.3em;
}

.detailslist {
  margin-bottom: 0.5em;

  .detailslistItem {
    margin-top: 5px;
    margin-bottom: 0.5em;
    margin-left: 10px;
  }
}

.detailslistNotAvailable {
  color: gray;
}

.forcewrap {
  flex-basis: 100%;
  height: 0;
}

#sitelanding .graph {
  flex-grow: 1;
  flex-basis: 0;
}

#sitelanding .details {
  height: 100%;
}

#sitemap {
  height: 300px;
}

#sitemap .details {
  padding: 0;
}

.viz-options {
  display: flex;
  padding-top: 1rem;
}

.viz-option + .viz-option {
  margin-left: 1rem;
}

#reset {
  cursor: pointer;
  text-decoration: underline;
  color: #bcd2e2;
  margin-bottom: 2rem;
  margin-top: 20px;
  display: block;
  width: 100px;
}

#instruments {
  max-width: 650px;
}

.new-layout {
  display: flex;
  gap: 2rem;
}

aside {
  width: 300px;
  flex-shrink: 0;
}

.description {
  hyphens: auto;
  text-align: justify;
  flex-grow: 1;
}

.description:deep(p + p) {
  margin-top: 0.5rem;
}

h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-size: 125%;
}

dt {
  font-weight: 500;
  margin-top: 0.25rem;
}

:deep(.pagewidth) {
  max-width: 1000px;
}

@media screen and (max-width: $narrow-screen) {
  .new-layout {
    display: block;
  }
}
</style>
