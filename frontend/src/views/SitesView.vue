<template>
  <div>
    <LandingHeader title="Measurement sites" />
    <main>
      <template v-if="sites.status == 'ready'">
        <div v-for="item in sites.items" :key="item.title" class="item">
          <h2>{{ item.title }}</h2>
          <p v-html="item.descriptionHtml"></p>
          <div class="table-wrapper">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th class="column-status"></th>
                  <th class="column-location">Location</th>
                  <th class="column-country">Country</th>
                  <th class="column-station">Station</th>
                  <th class="column-latitude">Latitude</th>
                  <th class="column-longitude">Longitude</th>
                  <th class="column-altitude">Altitude</th>
                  <th class="column-networks">Networks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="site in item.sites" :key="site.id">
                  <td class="column-status">
                    <span :class="{ status: true, [site.status]: true }"></span>
                  </td>
                  <td class="column-location">
                    <router-link :to="{ name: 'Site', params: { siteId: site.id } }">
                      {{ site.humanReadableName }}
                    </router-link>
                  </td>
                  <td class="column-country">{{ site.country || "-" }}</td>
                  <td class="column-station">
                    {{ site.stationName || "" }}
                  </td>
                  <td class="column-latitude">
                    {{ site.latitude != null ? formatLatitude(site.latitude) : "-" }}
                  </td>
                  <td class="column-longitude">
                    {{ site.longitude != null ? formatLongitude(site.longitude) : "-" }}
                  </td>
                  <td class="column-altitude">
                    {{ site.altitude != null ? `${site.altitude} m` : "-" }}
                  </td>
                  <td class="column-networks">
                    <div class="tags">
                      <BaseTag v-if="site.actrisId" type="actris" size="small">ACTRIS</BaseTag>
                      <BaseTag v-if="site.type.includes('arm')" type="arm" size="small">ARM</BaseTag>
                      <BaseTag v-if="site.type.includes('polarin')" type="polarin" size="small">POLARIN</BaseTag>
                      <BaseTag v-if="site.type.includes('ri-urbans')" type="ri-urbans" size="small">RI-URBANS</BaseTag>
                      <BaseTag v-if="site.type.includes('fmi-radar')" type="fmi" size="small">FMI</BaseTag>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="legend">
            <span class="status cloudnet" v-if="item.legend[0]"></span>
            {{ item.legend[0] }}
            <span class="status active" v-if="item.legend[1]"></span>
            {{ item.legend[1] }}
            <span class="status inactive" v-if="item.legend[2]"></span>
            {{ item.legend[2] }}
          </p>
        </div>
      </template>
      <BaseSpinner v-else-if="sites.status == 'loading'" />
      <div v-else-if="sites.status == 'error'">Failed to load sites.</div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { Site } from "@shared/entity/Site";
import axios from "axios";
import { backendUrl, formatLatitude, formatLongitude } from "@/lib";
import { ref, onMounted } from "vue";
import LandingHeader from "@/components/LandingHeader.vue";
import BaseTag from "@/components/BaseTag.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";

type SitesState =
  | { status: "loading" }
  | {
      status: "ready";
      items: { title: string; descriptionHtml: string; legend: [string, string, string]; sites: Site[] }[];
    }
  | { status: "error" };

const sites = ref<SitesState>({ status: "loading" });

onMounted(async () => {
  try {
    const response = await axios.get<Site[]>(`${backendUrl}sites`);
    sites.value = {
      status: "ready",
      items: [
        {
          title: "Cloudnet sites",
          descriptionHtml:
            'Permanent sites with full Cloudnet instrumentation. Most of the sites are part of the European <a href="https://www.actris.eu">ACTRIS research infrastructure</a>.',
          legend: ["Operational site", "Some data", "Inactive"],
          sites: response.data.filter((site) => !site.type.includes("hidden") && site.type.includes("cloudnet")),
        },
        {
          title: "Campaign sites",
          descriptionHtml: "Sites with some Cloudnet-compliant instrumentation.",
          legend: ["Operational site", "Some data", "Inactive"],
          sites: response.data.filter((site) => !site.type.includes("hidden") && site.type.includes("campaign")),
        },
        {
          title: "Weather radar sites",
          descriptionHtml: "Sites with vertical measurements from weather radar.",
          legend: ["Active", "", "Inactive"],
          sites: response.data.filter((site) => !site.type.includes("hidden") && site.type.includes("weather-radar")),
        },
        {
          title: "ARM sites",
          descriptionHtml: 'Sites part of the American <a href="https://arm.gov">ARM network</a>.',
          legend: ["Operational site", "Some data", "Inactive"],
          sites: response.data.filter((site) => !site.type.includes("hidden") && site.type.includes("arm")),
        },
        {
          title: "Model sites",
          descriptionHtml: "Sites with only model data.",
          legend: ["Active", "", "Inactive"],
          sites: response.data.filter((site) => site.type.includes("model")),
        },
      ],
    };
  } catch (error) {
    console.error(error);
    sites.value = { status: "error" };
  }
});
</script>

<style lang="scss" scoped>
@use "@/sass/variables.scss";

main {
  box-sizing: content-box;
  max-width: variables.$page-width;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

p {
  max-width: 800px;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: unset;
  margin-top: 0.5rem;
  overflow-wrap: normal;
}

.table-striped {
  th {
    font-weight: 600;
  }

  td,
  th {
    padding: 9px;

    &:nth-child(1) {
      padding-right: 0;
    }
  }

  tr:nth-child(2n + 1) > td {
    background-color: variables.$blue-dust;
  }
}

.table-striped[aria-busy="false"] {
  tr:hover td {
    cursor: pointer;
    background-color: #e4eff7;
  }

  tr:focus td {
    background-color: #e4eff7;
  }

  tr {
    outline: none;
  }
}

.item + .item {
  margin-top: 4rem;
}

.status {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  vertical-align: middle;

  &.cloudnet {
    background: #25910f;
  }

  &.active {
    background: #eed679;
  }

  &.inactive {
    background: #ddd;
  }
}

.legend {
  font-size: 75%;
  margin-top: 1rem;
  color: #666;

  .status {
    margin-left: 8px;
  }
}

.tags {
  display: flex;
  gap: 0.25rem;
}

@media screen and (max-width: 600px) {
  .table {
    width: 100%;
  }
  .column-station,
  .column-latitude,
  .column-longitude,
  .column-altitude,
  .column-networks {
    display: none;
  }
}
</style>
