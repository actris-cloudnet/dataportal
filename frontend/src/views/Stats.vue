<style scoped lang="sass">
h1
  margin-bottom: 1rem

table
  border-collapse: collapse

  &.loading
    opacity: 0.25

td, th
  padding: .25rem 1rem 0 0

  &:first-child
    text-align: right

.bar
  display: flex
  align-items: center

.bar-bar
  height: 1rem
  background-color: steelblue
  border-radius: 2px

.bar-number
  font-size: 70%
  margin-left: 4px

.placeholder
  color: gray

table,
.placeholder
  margin-top: 1rem

button
  margin-top: .5rem

legend
  font-size: inherit
  font-weight: bold
  margin: 0

.label
  font-weight: bold
</style>

<template>
  <main>
    <h1>Download statistics</h1>
    <span v-if="loadingSites" class="placeholder">Loading...</span>
    <template v-else>
      <label>
        <div class="label">Metric:</div>
        <select v-model="selectedDimensions">
          <option value="yearMonth,downloads">Monthly downloads</option>
          <option value="yearMonth,uniqueIps">Monthly unique IPs</option>
          <option value="country,downloads">Downloads by country</option>
        </select> </label
      ><br />
      <div style="display: flex; align-items: center">
        <label>
          <div class="label">Site:</div>
          <select v-model="siteModel">
            <option :value="null">--- any ---</option>
            <option v-for="option in sites" :key="option.id" :value="option.id">
              {{ option.label }}
            </option>
          </select>
        </label>
        <span style="padding: 0 1rem; color: gray"> or </span>
        <label>
          <div class="label">All sites in country:</div>
          <select v-model="countryModel">
            <option :value="null">--- any ---</option>
            <option v-for="option in countries" :key="option.id" :value="option.id">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>
      <fieldset>
        <legend class="label">Product type:</legend>
        <label>
          <input type="checkbox" value="observation" v-model="productTypes" />
          Observation
        </label>
        <label style="margin-left: 0.5rem">
          <input type="checkbox" value="model" v-model="productTypes" />
          Model
        </label>
      </fieldset>
      <div>
        <div class="label">Download date:</div>
        <input type="date" v-model="dateFrom" /> – <input type="date" v-model="dateTo" />
      </div>
      <button @click="onSearch" :disabled="loading">
        {{ loading ? "Loading..." : "Search" }}
      </button>
      <template v-if="!initial">
        <div v-if="statistics.length == 0" class="placeholder">No downloads.</div>
        <table v-else :class="{ loading }">
          <thead>
            <tr>
              <th>{{ dimensionLabel[dimensions[0]] }}</th>
              <th>{{ dimensionLabel[dimensions[1]] }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in statistics" :key="item[item[dimensions[0]]]">
              <td v-if="dimensions[0] == 'country'">
                {{ item[dimensions[0]] ? getCountryName(item[dimensions[0]]) : "Unknown" }}
              </td>
              <td v-else>
                {{ item[dimensions[0]] || "Unknown" }}
              </td>
              <td>
                <div class="bar">
                  <div
                    class="bar-bar"
                    :style="{
                      // Calculate bar width of at least 1 pixel.
                      width: Math.max(1, (100 * item[dimensions[1]]) / maxValue) + 'px',
                      // For 1 pixel bar, indicate quantity with opacity.
                      opacity: Math.min(1, 0.25 + 0.75 * ((100 * item[dimensions[1]]) / maxValue)),
                    }"
                  ></div>
                  <div class="bar-number">
                    {{ numberFormat.format(item[dimensions[1]]) }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </template>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

import { Site, SiteType } from "../../../backend/src/entity/Site";
import COUNTRY_NAMES from "../assets/country-io-names.json";
import { compareValues, notEmpty } from "../lib";

interface Option {
  id: string;
  label: string;
}

const apiUrl = process.env.VUE_APP_BACKENDURL;
const statistics = ref([]);
const dimensions = ref<string[]>([]);
const loading = ref(false);
const initial = ref(true);
const maxValue = ref(0);
const selectedDimensions = ref("yearMonth,downloads");
const dimensionLabel = {
  yearMonth: "Month",
  country: "Country",
  downloads: "Downloads (in variable years)",
  uniqueIps: "Unique IPs",
};
const numberFormat = (Intl && Intl.NumberFormat && new Intl.NumberFormat("en-GB")) || {
  format(number: number): string {
    return number.toString();
  },
};
const loadingSites = ref(true);
const countries = ref<Option[]>([]);
const sites = ref<Option[]>([]);
const productTypes = ref(["observation", "model"]);
const dateFrom = ref("");
const dateTo = ref("");

const currentCountry = ref<string | null>(null);
const currentSite = ref<string | null>(null);

const countryModel = computed({
  get: () => currentCountry.value,
  set(country) {
    currentCountry.value = country;
    currentSite.value = null;
  },
});

const siteModel = computed({
  get: () => currentSite.value,
  set(site) {
    currentCountry.value = null;
    currentSite.value = site;
  },
});

function getCountryName(countryCode: string): string {
  return (COUNTRY_NAMES as any)[countryCode] || `Unknown (${countryCode})`; // eslint-disable-line  @typescript-eslint/no-explicit-any
}

onMounted(async () => {
  try {
    const response = await axios.get(`${apiUrl}sites`);
    const data: Site[] = response.data;
    countries.value = Array.from(new Set(data.map((site) => site.countryCode).filter(notEmpty)))
      .map((countryCode) => ({
        id: countryCode,
        label: getCountryName(countryCode),
      }))
      .sort((a, b) => compareValues(a.label, b.label));
    sites.value = data
      .filter((site) => !site.type.includes("hidden" as SiteType))
      .map((site) => ({
        id: site.id,
        label: site.humanReadableName,
      }))
      .sort((a, b) => compareValues(a.label, b.label));
    loadingSites.value = false;
  } catch (e) {
    alert("Failed to download counties");
  }
});

async function onSearch() {
  loading.value = true;
  const params = {
    dimensions: selectedDimensions.value,
    country: currentCountry.value || undefined,
    site: currentSite.value || undefined,
    productTypes: productTypes.value.join(","),
    downloadDateFrom: dateFrom.value || undefined,
    downloadDateTo: dateTo.value || undefined,
  };
  try {
    const response = await axios.get(`${apiUrl}download/stats`, { params, withCredentials: true });
    loading.value = false;
    initial.value = false;
    dimensions.value = selectedDimensions.value.split(",");
    const data = response.data;
    maxValue.value = Math.max(...data.map((d) => d[dimensions.value[1]]));
    if (selectedDimensions.value === "country,downloads") {
      data.sort((a, b) => compareValues(b.downloads, a.downloads));
    }
    statistics.value = data;
  } catch (e) {
    loading.value = false;
    alert("Failed to download statistics");
  }
}
</script>
