<style lang="sass">
@import "@/sass/variables.sass"

h1
  margin-bottom: 3rem

h2
  margin-bottom: 1rem

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
        <table class="table table-striped">
          <thead>
            <tr>
              <th></th>
              <th>Site</th>
              <th>Country</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Altitude</th>
              <th>GAW ID</th>
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
              <td>{{ site.gaw || "-" }}</td>
            </tr>
          </tbody>
        </table>
        <p class="a-legend-class-not-overridden-by-some-global-style">
          <span class="status cloudnet"></span>
          Operational site
          <span class="status active"></span>
          Some data
          <span class="status inactive"></span>
          Inactive
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
  | { status: "ready"; items: { title: string; sites: Site[] }[] }
  | { status: "error" };

const sites = ref<SitesState>({ status: "loading" });

onMounted(async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}sites`);
    const normalSites = (response.data as Site[]).filter((site) => !site.type.includes("hidden" as SiteType));
    sites.value = {
      status: "ready",
      items: [
        {
          title: "Cloudnet sites",
          sites: normalSites.filter((site) => site.type.includes("cloudnet" as SiteType)),
        },
        {
          title: "Campaign sites",
          sites: normalSites.filter((site) => site.type.includes("campaign" as SiteType)),
        },
        {
          title: "ARM sites",
          sites: normalSites.filter((site) => site.type.includes("arm" as SiteType)),
        },
      ],
    };
  } catch (error) {
    console.error(error);
    sites.value = { status: "error" };
  }
});
</script>
