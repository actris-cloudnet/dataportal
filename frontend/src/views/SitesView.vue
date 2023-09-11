<style lang="sass" scoped>
@import "@/sass/variables.sass"

h1
  margin-bottom: 3rem

h2
  margin-bottom: 1rem

p
  max-width: 800px

.table
  width: unset

.table-striped
  th:focus
    outline: thin dotted
  td, th
    padding: 9px
    &:nth-child(1)
      padding-right: 0
  tr:nth-child(2n+1) > td
    background-color: $blue-dust
.table-striped[aria-busy="false"]
  tr:hover td
    cursor: pointer
    background-color: #e4eff7
  tr:focus td
    background-color: #e4eff7
  tr
    outline: none

.item + .item
  margin-top: 4rem

.status
  display: inline-block
  width: .6rem
  height: .6rem
  border-radius: 50%
  vertical-align: middle

  &.cloudnet
    background: #25910f

  &.active
    background: #eed679

  &.inactive
    background: #ddd

.a-legend-class-not-overridden-by-some-global-style
  font-size: 75%
  margin-top: 1rem
  color: #666

  .status
    margin-left: 8px
</style>

<template>
  <main>
    <h1>Measurement sites</h1>
    <template v-if="sites.status == 'ready'">
      <div v-for="item in sites.items" :key="item.title" class="item">
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
        <table class="table table-striped">
          <thead>
            <tr>
              <th></th>
              <th>Site</th>
              <th>Country</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Altitude</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="site in item.sites" :key="site.id">
              <td>
                <span :class="{ status: true, [site.status]: true }"></span>
              </td>
              <td>
                <router-link :to="{ name: 'Site', params: { siteid: site.id } }">
                  {{ site.humanReadableName }}
                </router-link>
              </td>
              <td>{{ site.country || "-" }}</td>
              <td>
                {{ site.latitude != null ? formatLatitude(site.latitude) : "-" }}
              </td>
              <td>
                {{ site.longitude != null ? formatLongitude(site.longitude) : "-" }}
              </td>
              <td>{{ site.altitude != null ? `${site.altitude}m` : "-" }}</td>
            </tr>
          </tbody>
        </table>
        <p class="a-legend-class-not-overridden-by-some-global-style">
          <span class="status cloudnet" v-if="item.legend[0]"></span>
          {{ item.legend[0] }}
          <span class="status active" v-if="item.legend[1]"></span>
          {{ item.legend[1] }}
          <span class="status inactive" v-if="item.legend[2]"></span>
          {{ item.legend[2] }}
        </p>
      </div>
    </template>
    <div v-else-if="sites.status == 'loading'">Loading...</div>
    <div v-else-if="sites.status == 'error'">Failed to load sites.</div>
  </main>
</template>

<script lang="ts" setup>
import type { Site, SiteType } from "@shared/entity/Site";
import axios from "axios";
import { formatLatitude, formatLongitude } from "@/lib";
import { ref, onMounted } from "vue";

type SitesState =
  | { status: "loading" }
  | { status: "ready"; items: { title: string; description: string; legend: string[]; sites: Site[] }[] }
  | { status: "error" };

const sites = ref<SitesState>({ status: "loading" });

onMounted(async () => {
  try {
    const response = await axios.get<Site[]>(`${import.meta.env.VITE_BACKEND_URL}sites`);
    sites.value = {
      status: "ready",
      items: [
        {
          title: "Cloudnet sites",
          description:
            "Sites with instrumentation required for the Cloudnet processing scheme. Most of the sites are part of the ACTRIS research infrastructure.",
          legend: ["Operational site", "Some data", "Inactive"],
          sites: response.data.filter(
            (site) => !site.type.includes("hidden" as SiteType) && site.type.includes("cloudnet" as SiteType),
          ),
        },
        {
          title: "Campaign sites",
          description:
            "Short-term Cloudnet-compliant sites. Most sites contain historical data and are processed using non-standard methods.",
          legend: ["Operational site", "Some data", "Inactive"],
          sites: response.data.filter(
            (site) => !site.type.includes("hidden" as SiteType) && site.type.includes("campaign" as SiteType),
          ),
        },
        {
          title: "ARM sites",
          description: "Sites part of ARM network with historical data processed using non-standard methods.",
          legend: ["Operational site", "Some data", "Inactive"],
          sites: response.data.filter(
            (site) => !site.type.includes("hidden" as SiteType) && site.type.includes("arm" as SiteType),
          ),
        },
        {
          title: "Model sites",
          description: "Sites with only model data.",
          legend: ["Active", "", "Inactive"],
          sites: response.data.filter((site) => site.type.includes("model" as SiteType)),
        },
      ],
    };
  } catch (error) {
    console.error(error);
    sites.value = { status: "error" };
  }
});
</script>
