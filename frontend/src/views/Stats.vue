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
              <th>{{ DIMENSION_LABEL[dimensions[0]] }}</th>
              <th>{{ DIMENSION_LABEL[dimensions[1]] }}</th>
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

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import axios from "axios";

import { Site, SiteType } from "../../../backend/src/entity/Site";
import COUNTRY_NAMES from "../assets/country-io-names.json";
import { compareValues, notEmpty } from "../lib";

interface Option {
  id: string;
  label: string;
}

@Component({
  components: {},
})
export default class StatsView extends Vue {
  apiUrl = process.env.VUE_APP_BACKENDURL;
  statistics: any[] = []; // eslint-disable-line  @typescript-eslint/no-explicit-any
  dimensions: string[] = [];
  loading = false;
  initial = true;
  maxValue = 0;
  selectedDimensions = "yearMonth,downloads";
  DIMENSION_LABEL = {
    yearMonth: "Month",
    country: "Country",
    downloads: "Downloads (in variable years)",
    uniqueIps: "Unique IPs",
  };
  numberFormat = (Intl && Intl.NumberFormat && new Intl.NumberFormat("en-GB")) || {
    format(number: number): string {
      return number.toString();
    },
  };
  loadingSites = true;
  countries: Option[] = [];
  sites: Option[] = [];
  productTypes = ["observation", "model"];
  dateFrom = "";
  dateTo = "";

  currentCountry: string | null = null;
  currentSite: string | null = null;

  get countryModel(): string | null {
    return this.currentCountry;
  }

  set countryModel(country: string | null) {
    this.currentCountry = country;
    this.currentSite = null;
  }

  get siteModel(): string | null {
    return this.currentSite;
  }

  set siteModel(site: string | null) {
    this.currentCountry = null;
    this.currentSite = site;
  }

  getCountryName(countryCode: string): string {
    return (COUNTRY_NAMES as any)[countryCode] || `Unknown (${countryCode})`; // eslint-disable-line  @typescript-eslint/no-explicit-any
  }

  async created() {
    try {
      const response = await axios.get(`${this.apiUrl}sites`);
      const sites: Site[] = response.data;
      this.countries = Array.from(new Set(sites.map((site) => site.countryCode).filter(notEmpty)))
        .map((countryCode) => ({
          id: countryCode,
          label: this.getCountryName(countryCode),
        }))
        .sort((a, b) => compareValues(a.label, b.label));
      this.sites = sites
        .filter((site) => !site.type.includes("hidden" as SiteType))
        .map((site) => ({
          id: site.id,
          label: site.humanReadableName,
        }))
        .sort((a, b) => compareValues(a.label, b.label));
      this.loadingSites = false;
    } catch (e) {
      alert("Failed to download counties");
    }
  }

  async onSearch() {
    this.loading = true;
    const params = {
      dimensions: this.selectedDimensions,
      country: this.currentCountry || undefined,
      site: this.currentSite || undefined,
      productTypes: this.productTypes.join(","),
      downloadDateFrom: this.dateFrom || undefined,
      downloadDateTo: this.dateTo || undefined,
    };
    try {
      const response = await axios.get(`${this.apiUrl}download/stats`, { params, withCredentials: true });
      this.loading = false;
      this.initial = false;
      this.statistics = response.data;
      this.dimensions = this.selectedDimensions.split(",");
      this.maxValue = Math.max(...this.statistics.map((d) => d[this.dimensions[1]]));
      if (this.selectedDimensions === "country,downloads") {
        this.statistics.sort((a, b) => compareValues(b.downloads, a.downloads));
      }
    } catch (e) {
      this.loading = false;
      alert("Failed to download statistics");
    }
  }
}
</script>
