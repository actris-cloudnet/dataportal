<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"
@import "@/sass/spinner.sass"

.availabilityviz
  margin-bottom: 2em

  h3
    text-align: center

.firstcolumn
  width: 50%
  float: left
  padding-right: 1em
  margin-bottom: $footer-height

.secondcolumn
  width: 50%
  float: right
  padding-left: 1em
  margin-bottom: $footer-height

.slider
  text-align: center
  height: 5em

.slider.disabled
  opacity: 0.2

.loadingoverlay.absolute
  position: relative
  top: -5em
  margin-bottom: -5em
  z-index: 4
</style>

<template>
  <main id="data_availability">
    <div class="slider">
      <label for="yearrange">Show last years:</label><br />
      1
      <input
        type="range"
        id="yearrange"
        v-model="yearRange"
        min="1"
        max="11"
        step="1"
        :title="yearRange"
        @mouseup="refreshViz()"
      />
      All
    </div>
    <div class="firstcolumn">
      <section class="availabilityviz" v-for="site in evenSites" :key="site.id">
        <h3>{{ site.humanReadableName }}</h3>
        <ProductAvailabilityVisualization
          v-if="readySites.includes(site.id)"
          :site="site.id"
          :legend="false"
          :dataStatus="dataStatuses[site.id]"
          :downloadComplete="() => (completedDownloads += 1)"
        />
        <div v-else class="loadingoverlay">
          <div class="lds-dual-ring"></div>
        </div>
      </section>
    </div>
    <div class="secondcolumn">
      <section class="availabilityviz" v-for="site in oddSites" :key="site.id">
        <h3>{{ site.humanReadableName }}</h3>
        <ProductAvailabilityVisualization
          v-if="readySites.includes(site.id)"
          :site="site.id"
          :legend="false"
          :dataStatus="dataStatuses[site.id]"
          :downloadComplete="() => (completedDownloads += 1)"
        />
        <div v-else class="loadingoverlay">
          <div class="lds-dual-ring"></div>
        </div>
      </section>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import type { Site, SiteType } from "@shared/entity/Site";
import ProductAvailabilityVisualization from "@/components/DataStatusVisualization.vue";
import { parseDataStatus, type DataStatus } from "@/lib/DataStatusParser";

const apiUrl = import.meta.env.VITE_BACKEND_URL;
const sites = ref<Site[]>([]);
const completedDownloads = ref(0);
const yearRange = ref("1");
const dateFrom = ref("1971-01-01");
const dataStatuses = ref<Record<string, DataStatus>>({});
const readySites = ref<string[]>([]);

async function initDataStatusParser(site: Site) {
  const properties = ["measurementDate", "productId", "legacy"];
  const payload = {
    site: site.id,
    showLegacy: true,
    dateFrom: dateFrom.value,
    properties,
  };
  dataStatuses.value[site.id] = await parseDataStatus(payload);
  readySites.value.push(site.id);
}

async function refreshViz() {
  readySites.value = [];
  const yearNow = new Date().getFullYear();
  const dateFromYear =
    yearRange.value === "11" ? 1971 : yearNow - parseInt(yearRange.value);
  dateFrom.value = `${dateFromYear}-01-01`;
  completedDownloads.value = 0;
  await Promise.all(sites.value.map(initDataStatusParser));
}

onMounted(async () => {
  const res = await axios.get(`${apiUrl}sites/`);
  sites.value = res.data.filter((site: Site) =>
    site.type.includes("cloudnet" as SiteType)
  );
  await refreshViz();
});

const evenSites = computed(() =>
  sites.value.filter((site, index) => !(index % 2))
);

const oddSites = computed(() => sites.value.filter((site, index) => index % 2));
</script>
