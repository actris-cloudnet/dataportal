<template>
  <div>
    <LandingHeader title="Measurement sites" />
    <main>
      <template v-if="sites.status == 'ready'">
        <div v-for="item in sites.items" :key="item.title" class="item">
          <h2>{{ item.title }}</h2>
          <p>{{ item.description }}</p>
          <div class="table-wrapper">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th></th>
                  <th>Location</th>
                  <th>Country</th>
                  <th>Station</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Altitude</th>
                  <th>Network</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="site in item.sites" :key="site.id">
                  <td>
                    <span :class="{ status: true, [site.status]: true }"></span>
                  </td>
                  <td>
                    <router-link :to="{ name: 'Site', params: { siteId: site.id } }">
                      {{ site.humanReadableName }}
                    </router-link>
                  </td>
                  <td>{{ site.country || "-" }}</td>
                  <td>
                    {{ site.stationName || "" }}
                  </td>
                  <td>
                    {{ site.latitude != null ? formatLatitude(site.latitude) : "-" }}
                  </td>
                  <td>
                    {{ site.longitude != null ? formatLongitude(site.longitude) : "-" }}
                  </td>
                  <td>{{ site.altitude != null ? `${site.altitude} m` : "-" }}</td>
                  <td>
                    <BaseTag
                      v-if="site.actrisId"
                      type="actris"
                      size="small"
                      title="This station is a component of an ACTRIS National Facility."
                    >
                      ACTRIS
                    </BaseTag>
                    <BaseTag v-if="site.type.includes('arm')" type="arm" size="small">ARM</BaseTag>
                    <BaseTag v-if="site.type.includes('ri-urbans')" type="ri-urbans" size="small">RI-URBANS</BaseTag>
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
      items: { title: string; description: string; legend: [string, string, string]; sites: Site[] }[];
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
          description:
            "Permanent sites with instrumentation required for the Cloudnet processing scheme. Most of the sites are part of the ACTRIS research infrastructure.",
          legend: ["Operational site", "Some data", "Inactive"],
          sites: response.data.filter((site) => !site.type.includes("hidden") && site.type.includes("cloudnet")),
        },
        {
          title: "Campaign sites",
          description:
            "Short-term sites compliant with the Cloudnet processing scheme. Most sites contain historical data processed using non-standard methods.",
          legend: ["Operational site", "Some data", "Inactive"],
          sites: response.data.filter((site) => !site.type.includes("hidden") && site.type.includes("campaign")),
        },
        {
          title: "ARM sites",
          description: "Sites part of ARM network with historical data processed using non-standard methods.",
          legend: ["Operational site", "Some data", "Inactive"],
          sites: response.data.filter((site) => !site.type.includes("hidden") && site.type.includes("arm")),
        },
        {
          title: "Model sites",
          description: "Sites with only model data.",
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
</style>
