<template>
  <div>
    <LandingHeader title="Statistics" />
    <main class="pagewidth">
      <BaseSpinner v-if="loadingSites" class="placeholder" />
      <template v-else>
        <MultiSelect
          class="field"
          id="metric"
          label="Metric"
          v-model="selectedDimensions"
          :options="[
            { id: 'yearMonth,downloads', humanReadableName: 'Monthly downloads' },
            { id: 'year,downloads', humanReadableName: 'Yearly downloads' },
            { id: 'yearMonth,uniqueIps', humanReadableName: 'Monthly unique IPs' },
            { id: 'year,uniqueIps', humanReadableName: 'Yearly unique IPs' },
            { id: 'country,downloads', humanReadableName: 'Downloads by country' },
            { id: 'yearMonth,visits', humanReadableName: 'Monthly visits' },
            { id: 'year,visits', humanReadableName: 'Yearly visits' },
            { id: 'country,visits', humanReadableName: 'Visits by country' },
            { id: 'yearMonth,curatedData', humanReadableName: 'Monthly curated data' },
            { id: 'year,curatedData', humanReadableName: 'Yearly curated data' },
          ]"
          style="width: 300px"
        />
        <div class="daterange field">
          <MultiSelect
            id="site"
            label="Site"
            v-model="siteModel"
            :options="sites"
            style="width: 300px"
            :disabled="visitStatistics"
            clearable
          />
          <span>or</span>
          <MultiSelect
            id="country"
            label="Sites in country"
            v-model="countryModel"
            :options="countries"
            style="width: 300px"
            :disabled="visitStatistics"
            clearable
          />
        </div>
        <fieldset class="field" :disabled="visitStatistics">
          <legend class="label">Product type</legend>
          <CheckBox v-model="productTypes" value="observation" label="Observation" />
          <CheckBox v-model="productTypes" value="model" label="Model" style="margin-left: 0.5rem" />
        </fieldset>
        <fieldset class="field">
          <legend class="label">Measurement date</legend>
          <div class="daterange">
            <DatePicker
              v-model="measurementDateFrom"
              :end="measurementDateTo || undefined"
              name="measurementDateFrom"
            />
            <span>–</span>
            <DatePicker
              v-model="measurementDateTo"
              :start="measurementDateFrom || undefined"
              name="measurementDateTo"
            />
          </div>
        </fieldset>
        <fieldset class="field" :disabled="curatedStatistics">
          <legend class="label">Download date</legend>
          <div class="daterange">
            <DatePicker v-model="downloadDateFrom" :end="downloadDateTo || undefined" name="downloadDateFrom" />
            <span>–</span>
            <DatePicker v-model="downloadDateTo" :start="downloadDateFrom || undefined" name="downloadDateTo" />
          </div>
        </fieldset>
        <div></div>
        <div style="display: flex; gap: 1rem; margin-top: 1rem">
          <BaseButton type="primary" @click="onSearch" :disabled="loading">
            {{ loading ? "Loading..." : "Search" }}
          </BaseButton>
          <BaseButton type="secondary" href="/stats"> Reset </BaseButton>
        </div>
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
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

import type { Site } from "@shared/entity/Site";
import COUNTRY_NAMES from "@/assets/country-io-names.json";
import { backendUrl, compareValues, notEmpty } from "@/lib";
import CheckBox from "@/components/CheckBox.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";
import MultiSelect, { type Option } from "@/components/MultiSelect.vue";
import DatePicker from "@/components/DatePicker.vue";
import LandingHeader from "@/components/LandingHeader.vue";
import { loginStore } from "@/lib/auth";

type Dimension = "year" | "yearMonth" | "country" | "downloads" | "uniqueIps" | "visits" | "curatedData";

const statistics = ref([]);
const dimensions = ref<Dimension[]>([]);
const loading = ref(false);
const initial = ref(true);
const maxValue = ref(0);
const selectedDimensions = ref("yearMonth,downloads");
const dimensionLabel: Record<Dimension, string> = {
  year: "Year",
  yearMonth: "Month",
  country: "Country",
  downloads: "Downloads (variable years)",
  uniqueIps: "Unique IPs",
  visits: "Visits",
  curatedData: "Curated data (variable years)",
};
const numberFormat = (Intl && Intl.NumberFormat && new Intl.NumberFormat("en-GB")) || {
  format(number: number): string {
    return number.toString();
  },
};
const loadingSites = ref(true);
const countries = ref<Option[]>([]);
const sites = ref<Site[]>([]);
const productTypes = ref(["observation", "model"]);
const downloadDateFrom = ref<string | null>(null);
const downloadDateTo = ref<string | null>(null);
const measurementDateFrom = ref<string | null>(null);
const measurementDateTo = ref<string | null>(null);
const visitStatistics = computed(() => selectedDimensions.value.includes("visit"));
const curatedStatistics = computed(() => selectedDimensions.value.includes("curatedData"));

const currentCountry = ref<string | null>(null);
const currentSite = ref<string | null>(null);

const countryModel = computed({
  get: () => {
    return currentCountry.value;
  },
  set: (country) => {
    currentCountry.value = country;
    currentSite.value = null;
  },
});

const siteModel = computed({
  get: () => currentSite.value,
  set: (site) => {
    currentCountry.value = null;
    currentSite.value = site;
  },
});

function getCountryName(countryCode: string): string {
  return (COUNTRY_NAMES as any)[countryCode] || `Unknown (${countryCode})`;
}

onMounted(async () => {
  try {
    const response = await axios.get(`${backendUrl}sites`);
    const data: Site[] = response.data;
    countries.value = Array.from(new Set(data.map((site) => site.countryCode).filter(notEmpty)))
      .map((countryCode) => ({
        id: countryCode,
        humanReadableName: getCountryName(countryCode),
      }))
      .sort((a, b) => compareValues(a.humanReadableName, b.humanReadableName));
    sites.value = data
      .filter((site) => !site.type.includes("hidden"))
      .sort((a, b) => compareValues(a.humanReadableName, b.humanReadableName));
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
    downloadDateFrom: downloadDateFrom.value ? !curatedStatistics.value && downloadDateFrom.value : undefined,
    downloadDateTo: downloadDateTo.value ? !curatedStatistics.value && downloadDateTo.value : undefined,
    measurementDateFrom: measurementDateFrom.value ? measurementDateFrom.value : undefined,
    measurementDateTo: measurementDateTo.value ? measurementDateTo.value : undefined,
  };
  try {
    const response = await axios.get(`${backendUrl}statistics`, {
      params,
      auth: { username: loginStore.username, password: loginStore.password },
    });
    loading.value = false;
    initial.value = false;
    dimensions.value = selectedDimensions.value.split(",") as Dimension[];
    const data = response.data;
    maxValue.value = Math.max(...data.map((d: any) => d[dimensions.value[1]]));
    if (selectedDimensions.value === "country,downloads") {
      data.sort((a: any, b: any) => compareValues(b.downloads, a.downloads));
    } else if (selectedDimensions.value.includes("yearMonth")) {
      data.sort((a: any, b: any) => compareValues(b.yearMonth, a.yearMonth));
    } else if (selectedDimensions.value.includes("year")) {
      data.sort((a: any, b: any) => compareValues(b.year, a.year));
    }
    statistics.value = data;
  } catch (e) {
    loading.value = false;
    alert("Failed to download statistics");
  }
}
</script>

<style scoped lang="scss">
main {
  margin-bottom: 2rem;
}

table {
  border-collapse: collapse;

  &.loading {
    opacity: 0.25;
  }
}

td,
th {
  padding: 0.25rem 1rem 0 0;

  &:first-child {
    text-align: right;
  }
}

th {
  font-weight: 500;
}

.bar {
  display: flex;
  align-items: center;
}

.bar-bar {
  height: 1rem;
  background-color: steelblue;
  border-radius: 2px;
}

.bar-number {
  font-size: 70%;
  margin-left: 4px;
}

.placeholder {
  color: gray;
}

table,
.placeholder {
  margin-top: 1rem;
}

.daterange {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.field {
  margin-top: 0.5rem;
}
</style>
