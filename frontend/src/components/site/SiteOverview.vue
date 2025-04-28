<template>
  <main class="pagewidth">
    <div class="new-layout">
      <section class="description">
        <div v-html="description[0]" v-if="description"></div>
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
            <BaseTag v-if="nominalUuids.has(instrument.uuid)" type="actris" size="small">Nominal</BaseTag>
          </div>
        </div>
        <div v-else class="detailslistNotAvailable">
          No data received in the last {{ instrumentsFromLastDays }} days.
        </div>
        <div v-html="description[1]" v-if="description"></div>
        <BaseSpinner v-if="siteLinks.status === 'loading'" />
        <template v-else-if="siteLinks.status == 'ready'">
          <template v-if="links.length > 0 || siteLinks.value.actris || siteLinks.value.dvas || siteLinks.value.wigos">
            <h2>Links</h2>
            <ul style="list-style: disc; padding-left: 1rem; margin-bottom: 2rem">
              <li v-for="link in links" :key="link" v-html="link"></li>
              <li v-if="siteLinks.value.dvas">
                <a :href="siteLinks.value.dvas.uri">{{ siteLinks.value.dvas.name }}</a> in ACTRIS data portal
              </li>
              <li v-if="siteLinks.value.actris">
                <a :href="siteLinks.value.actris.uri">{{ siteLinks.value.actris.name }}</a> in ACTRIS labelling database
              </li>
              <li v-if="siteLinks.value.wigos">
                <a :href="siteLinks.value.wigos.uri">{{ siteLinks.value.wigos.name }}</a> in WMO Integrated Global
                Observing System (WIGOS)
              </li>
            </ul>
          </template>
        </template>
        <template v-else-if="siteLinks.status === 'error'">
          <h2>Links</h2>
          <p style="color: red">Failed to load links.</p>
        </template>
      </section>
      <aside>
        <section id="sitemap" v-if="site.type.includes('mobile')">
          <BaseSpinner v-if="locations.status === 'loading'" />
          <TrackMap v-else-if="locations.status === 'ready'" :site="site.id" :track="locations.value" />
          <div v-else-if="locations.status === 'notFound'" style="padding: 10px; color: gray">No location history.</div>
          <div v-else-if="locations.status === 'error'" style="padding: 10px; color: red">
            Failed to load location history.
          </div>
        </section>
        <section id="sitemap" v-else-if="site.latitude != null && site.longitude != null">
          <MyMap :sites="[site]" :center="[site.latitude, site.longitude]" :zoom="5" :fullHeight="true" :key="mapKey" />
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
            <template v-if="site.persons.length > 0">
              <dt>Contact</dt>
              <dd>
                <ul>
                  <li v-for="person in site.persons" :key="person.id">
                    {{ person.firstname }} {{ person.surname }}
                    <a :href="'https://orcid.org/' + person.orcid" target="_blank" v-if="person.orcid">
                      <img :src="orcidLogo" width="16" height="16" alt="ORCID" />
                    </a>
                  </li>
                </ul>
              </dd>
            </template>
          </dl>
        </section>
      </aside>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import type { Site, SiteLinks } from "@shared/entity/Site";
import type { NominalInstrument } from "@shared/entity/Instrument";
import MyMap from "@/components/SuperMap.vue";
import { formatCoordinates, getInstrumentIcon, backendUrl } from "@/lib";
import type { ReducedMetadataResponse } from "@shared/entity/ReducedMetadataResponse";
import TrackMap, { type Point } from "@/components/TrackMap.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";
import type { RouteLocationRaw } from "vue-router";
import orcidLogo from "@/assets/icons/orcid.png";
import BaseTag from "@/components/BaseTag.vue";

interface Instrument {
  to: RouteLocationRaw | null;
  name: string;
  icon: string;
  uuid: string;
}

type LocationsResult =
  | { status: "loading" }
  | { status: "ready"; value: Point[] }
  | { status: "notFound" }
  | { status: "error"; error: Error };

type SiteLinksResult =
  | { status: "loading" }
  | { status: "ready"; value: SiteLinks }
  | { status: "error"; error: Error };

export interface Props {
  site: Site;
}

const props = defineProps<Props>();

const instruments = ref<Instrument[]>([]);
const nominalUuids = ref(new Set());
const instrumentsFromLastDays = 30;
const instrumentsStatus = ref<"loading" | "error" | "ready">("loading");
const mapKey = ref(0);
const locations = ref<LocationsResult>({ status: "loading" });
const siteLinks = ref<SiteLinksResult>({ status: "loading" });

const description = computed(() => {
  if (!props.site.description) return null;
  const i = props.site.description.indexOf("<h2>");
  const j = props.site.description.indexOf("<h2>Links</h2>");
  return [props.site.description.slice(0, i), props.site.description.slice(i, j >= 0 ? j : undefined)];
});

const links = computed(() => {
  if (!props.site.description) return [];
  const i = props.site.description.indexOf("<h2>Links</h2>");
  const m = props.site.description.slice(i).match(/<a href="[^"]+">[^<]+<\/a>/g);
  return m || [];
});

onMounted(() => {
  if (props.site.type.includes("mobile")) {
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
  axios
    .get<SiteLinks>(`${backendUrl}sites/${props.site.id}/links`)
    .then((res) => {
      siteLinks.value = { status: "ready", value: res.data };
    })
    .catch((error) => {
      siteLinks.value = { status: "error", error };
      console.error("Failed to load links", error);
    });
  Promise.all([loadInstruments(), loadNominalInstruments()])
    .then(([inst, nominal]) => {
      instruments.value = inst;
      nominalUuids.value = nominal;
      instrumentsStatus.value = "ready";
    })
    .catch((error) => {
      console.error(error);
      instrumentsStatus.value = "error";
    });
});

function handleInstrument(response: ReducedMetadataResponse): Instrument {
  // TODO: Should be always available...
  if (response.instrumentInfo) {
    return {
      to: { name: "Instrument", params: { uuid: response.instrumentInfo.uuid } },
      name: `${response.instrumentInfo.name} ${response.instrumentInfo.type}`,
      icon: getInstrumentIcon(response.instrument),
      uuid: response.instrumentInfo.uuid,
    };
  } else {
    return {
      to: null,
      name: `Unidentified ${response.instrument.humanReadableName}`,
      icon: getInstrumentIcon(response.instrument),
      uuid: "",
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
  return res.data.map(handleInstrument);
}

async function loadNominalInstruments() {
  const now = new Date();
  const res = await axios.get<NominalInstrument[]>(`${backendUrl}nominal-instrument/`, {
    params: {
      site: props.site.id,
      date: now,
    },
  });
  return new Set(res.data.flatMap((item) => item.nominalInstrument.uuid));
}
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

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

    .tag {
      margin-left: 0.25rem;
    }
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

.description:deep(ul) {
  list-style: disc;
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

:deep() {
  h2 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-size: 125%;
  }

  ul.references {
    margin-left: 2rem;
    text-indent: -2rem;
    padding: 0;
    list-style: none;

    li + li {
      margin-top: 0.5rem;
    }

    em {
      font-style: italic;
    }
  }
}

dt {
  font-weight: 500;
  margin-top: 0.25rem;
}

:deep(.pagewidth) {
  max-width: 1000px;
}

@media screen and (max-width: variables.$narrow-screen) {
  .new-layout {
    display: block;
  }
}
</style>
