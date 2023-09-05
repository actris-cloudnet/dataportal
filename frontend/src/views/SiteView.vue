<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"
@import "@/sass/landing.sass"
@import "@/sass/spinner.sass"

.forcewrap
  flex-basis: 100%
  height: 0

#sitelanding .graph
  flex-grow: 1
  flex-basis: 0
  min-width: 600px

#sitelanding .details
  height: 100%

#sitemap .details
  padding: 0

#siteselect
  padding-top: 25px
  width: 250px

#reset
  cursor: pointer
  text-decoration: underline
  color: #bcd2e2
  margin-bottom: $filter-margin
  margin-top: 20px
  display: block

#instruments
  max-width: 650px

.warningnote
  margin: 1em 0 0
  border-color: #fff2ca
  background: #fffdee

.errornote
  border-color: #ffcaca
  background: #fee
</style>

<template>
  <main id="sitelanding" v-if="!error && response">
    <img alt="back" id="backButton" :src="backIcon" @click="$router.back()" />
    <header>
      <h2>{{ response.humanReadableName }}</h2>
      <span>
        Measurement station<template v-if="response.country"> in {{ response.country }}</template
        >.
      </span>
    </header>
    <main class="infoBox">
      <section id="summary">
        <header>Summary</header>
        <section class="details">
          <dl>
            <dt>Location</dt>
            <dd>
              {{ response.humanReadableName }}<template v-if="response.country">, {{ response.country }}</template>
            </dd>
            <dt>ACTRIS name</dt>
            <dd v-if="nfName" style="max-width: 300px">
              <a :href="nfLink">{{ nfName }}</a>
            </dd>
            <dd class="notAvailable" v-else></dd>
            <template v-if="response.latitude != null && response.longitude != null">
              <dt>Coordinates</dt>
              <dd>
                {{ formatCoordinates(response.latitude, response.longitude) }}
              </dd>
            </template>
            <template v-if="response.altitude != null">
              <dt>Site altitude</dt>
              <dd>{{ response.altitude }} m</dd>
            </template>
            <dt>Last measurement</dt>
            <dd v-if="latestFile">{{ latestFile.measurementDate }}</dd>
            <dd class="notAvailable" v-else></dd>
          </dl>
        </section>
      </section>
      <section id="instruments">
        <header>Instruments</header>
        <section class="details">
          <div v-if="instrumentsStatus === 'loading'" class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
          <div v-else-if="instrumentsStatus === 'error'" class="detailslistError">
            Failed to load instrument information.
          </div>
          <div v-else-if="instruments && instruments.length" class="detailslist">
            <div class="notice">
              The site has submitted data from the following instruments in the last
              {{ instrumentsFromLastDays }} days:
            </div>
            <div v-for="(instrument, index) in instruments" :key="index" class="detailslistItem">
              <img alt="instrument icon" :src="instrument.icon" class="product" />
              <span v-if="instrument.pid">
                <a :href="instrument.pid">{{ instrument.name }}</a>
              </span>
              <span v-else>{{ instrument.name }}</span>
            </div>
          </div>
          <div v-else class="detailslistNotAvailable">
            No data received in the last {{ instrumentsFromLastDays }} days.
          </div>
        </section>
      </section>
      <section id="sitemap" v-if="response.type.includes('mobile' as SiteType)">
        <header>Map</header>
        <section class="details">
          <div v-if="locations.status === 'loading'" class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
          <TrackMap v-else-if="locations.status === 'ready'" :site="response.id" :track="locations.value" />
          <div v-else-if="locations.status === 'notFound'" style="padding: 10px; color: gray">No location history.</div>
          <div v-else-if="locations.status === 'error'" style="padding: 10px; color: red">
            Failed to load location history.
          </div>
        </section>
      </section>
      <section id="sitemap" v-else-if="response.latitude != null && response.longitude != null">
        <header>Map</header>
        <section class="details">
          <MyMap
            v-if="!busy"
            :sites="[response]"
            :center="[response.latitude, response.longitude]"
            :zoom="5"
            :fullHeight="true"
            :key="mapKey"
          />
          <div v-else class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
        </section>
      </section>
      <div class="forcewrap"></div>

      <section id="product_availability" class="graph" v-if="!selectedProductName">
        <header>Product availability</header>
        <section class="details">
          <ProductAvailabilityVisualization
            v-if="dataStatus"
            :site="siteid"
            :legend="true"
            :tooltips="true"
            :dataStatus="dataStatus"
          />
          <div v-else class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
        </section>
      </section>

      <section id="product_quality" class="graph">
        <header>
          Product quality
          <template v-if="selectedProductName">/ availability ({{ selectedProductName }})</template>
        </header>

        <section class="details" v-if="selectedProductId">
          <ProductAvailabilityVisualizationSingle
            v-if="dataStatus"
            :site="siteid"
            legend
            tooltips
            qualityScores
            :product="selectedProductId"
            :dataStatus="dataStatus"
          />
          <div v-else class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
        </section>

        <section class="details" v-else>
          <ProductAvailabilityVisualization
            v-if="dataStatus"
            :site="siteid"
            legend
            tooltips
            qualityScores
            :dataStatus="dataStatus"
          />
          <div v-else class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
        </section>
      </section>
    </main>

    <div v-if="dataStatus">
      <div id="siteselect">
        <custom-multiselect
          v-if="dataStatus"
          v-model="selectedProductId"
          label="Product filter"
          :options="dataStatus.availableProducts"
          id="singleProductSelect"
          :getIcon="getProductIcon"
        />
      </div>
      <a @click="reset" id="reset">Reset filter</a>
    </div>
  </main>

  <ApiError v-else-if="error" />
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, computed } from "vue";
import axios from "axios";
import type { Site, SiteType } from "@shared/entity/Site";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";
import MyMap from "@/components/SuperMap.vue";
import ProductAvailabilityVisualization from "@/components/ProductAvailabilityVisualization.vue";
import ProductAvailabilityVisualizationSingle from "@/components/ProductAvailabilityVisualizationSingle.vue";
import { getProductIcon, formatCoordinates, fetchInstrumentName, actrisNfUrl, getInstrumentIcon } from "@/lib";
import { parseDataStatus, type DataStatus } from "@/lib/DataStatusParser";
import CustomMultiselect from "@/components/MultiSelect.vue";
import type { ReducedMetadataResponse } from "@shared/entity/ReducedMetadataResponse";
import TrackMap, { type Point } from "@/components/TrackMap.vue";
import ApiError from "./ApiError.vue";
import backIcon from "@/assets/icons/back.png";
import { useTitle } from "@/router";

export interface Props {
  siteid: string;
}

interface Instrument {
  pid: string | null;
  name: string;
  icon: string;
}

type LocationsResult =
  | { status: "loading" }
  | { status: "ready"; value: Point[] }
  | { status: "notFound" }
  | { status: "error"; error: Error };

const props = defineProps<Props>();

const apiUrl = import.meta.env.VITE_BACKEND_URL;
const response = ref<Site | null>(null);
const latestFile = ref<SearchFileResponse | null>(null);
const error = ref(false);
const instruments = ref<Instrument[]>([]);
const instrumentsFromLastDays = 30;
const instrumentsStatus = ref<"loading" | "error" | "ready">("loading");
const selectedProductId = ref<string | null>(null);
const mapKey = ref(0);
const busy = ref(false);
const dataStatus = ref<DataStatus | null>(null);
const nfName = ref<string>();
const nfLink = ref<string>();
const locations = ref<LocationsResult>({ status: "loading" });

const title = computed(() => [response.value?.humanReadableName, "Measurement sites"]);

useTitle(title);

onMounted(() => {
  axios
    .get(`${apiUrl}sites/${props.siteid}`)
    .then((res) => {
      response.value = res.data;
      if (response.value?.type.includes("mobile" as SiteType)) {
        axios
          .get(`${apiUrl}sites/${props.siteid}/locations`)
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
    })
    .catch((error) => {
      error.value = true;
      response.value = error.response;
    });
  axios
    .get(`${apiUrl}search/`, {
      params: {
        site: props.siteid,
        product: ["radar", "lidar", "mwr"],
        limit: 1,
      },
    })
    .then(({ data }) => (latestFile.value = data[0]))
    .catch((error) => {
      console.error(error);
    });
  initDataStatusParser().catch((error) => {
    console.error(error);
  });
  loadInstruments().catch((error) => {
    console.error(error);
    instrumentsStatus.value = "error";
  });
});

watch(
  () => response.value,
  () => {
    if (!response.value?.actrisId) {
      return;
    }
    const apiUrl = `${actrisNfUrl}/api/facilities/${response.value.actrisId}`;
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
);

const selectedProductName = computed(() => {
  if (!selectedProductId.value || !dataStatus.value || !dataStatus.value.availableProducts) {
    return null;
  }
  const product = dataStatus.value.availableProducts.find((product) => product.id === selectedProductId.value);
  if (!product) return null;
  return product.humanReadableName;
});

function reset() {
  selectedProductId.value = null;
}

async function initDataStatusParser(product: string | null = null) {
  const properties = ["measurementDate", "productId", "legacy", "uuid", "errorLevel"];
  const payload = {
    site: props.siteid,
    showLegacy: true,
    product: product,
    properties,
  };
  dataStatus.value = await parseDataStatus(payload);
}

async function handleInstrument(response: ReducedMetadataResponse): Promise<Instrument> {
  if (response.instrumentPid) {
    return {
      pid: response.instrumentPid,
      name: await fetchInstrumentName(response.instrumentPid).catch((error) => {
        console.error("Failed to load instrument information", error);
        return response.instrument.humanReadableName;
      }),
      icon: getInstrumentIcon(response.instrument),
    };
  } else {
    return {
      pid: null,
      name: `Unidentified ${response.instrument.humanReadableName}`,
      icon: getInstrumentIcon(response.instrument),
    };
  }
}

async function loadInstruments() {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - instrumentsFromLastDays);
  const res = await axios.get(`${apiUrl}uploaded-metadata/`, {
    params: {
      site: props.siteid,
      updatedAtFrom: dateFrom,
      status: ["uploaded", "processed"],
    },
  });
  instruments.value = await Promise.all(res.data.map(handleInstrument));
  instrumentsStatus.value = "ready";
}
</script>
