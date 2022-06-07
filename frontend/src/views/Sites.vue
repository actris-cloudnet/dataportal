<style lang="sass">
@import "../sass/variables.sass"

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
  tr:nth-child(2n+1) > td
    background-color: $blue-dust
  td:nth-child(3)
    text-align: center
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
</style>

<template>
  <main>
    <h1>Measurement sites</h1>
    <div v-for="item in items" :key="item.title" class="item">
      <h2>{{ item.title }}</h2>
      <b-table
        borderless
        small
        striped
        hover
        sort-icon-left
        :items="item.sites"
        :fields="[
          { key: 'humanReadableName', label: 'Site', sortable: true },
          { key: 'country', label: 'Country', sortable: true, formatter: formatNull },
          { key: 'latitude', label: 'Latitude', sortable: true, formatter: formatNull(formatLatitude) },
          { key: 'longitude', label: 'Longitude', sortable: true, formatter: formatNull(formatLongitude) },
          { key: 'altitude', label: 'Altitude', sortable: true, formatter: formatNull(formatUnit('m')) },
          { key: 'gaw', label: 'GAW ID', formatter: formatNull },
        ]"
        @row-clicked="clickRow"
      />
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { BTable, BvTableFormatterCallback } from "bootstrap-vue/esm/components/table";
import { Site, SiteType } from "../../../backend/src/entity/Site";
import axios from "axios";
import { formatLatitude, formatLongitude } from "../lib";

function formatUnit(unit: string): BvTableFormatterCallback {
  return (value) => `${value} ${unit}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatNull(value: any): string | BvTableFormatterCallback {
  if (typeof value === "function") {
    return (value) => formatNull(value);
  }
  return value != null ? value : "-";
}

@Component({
  components: { BTable },
})
export default class SitesView extends Vue {
  apiUrl = process.env.VUE_APP_BACKENDURL;
  items: { title: string; sites: Site[] }[] = [];
  formatLatitude = formatLatitude;
  formatLongitude = formatLongitude;
  formatUnit = formatUnit;
  formatNull = formatNull;

  data() {
    return {
      items: [],
    };
  }

  async created() {
    const response = await axios.get(`${this.apiUrl}sites`);
    const sites = (response.data as Site[]).filter((site) => !site.type.includes("hidden" as SiteType));
    this.items = [
      {
        title: "Cloudnet sites",
        sites: sites.filter((site) => site.type.includes("cloudnet" as SiteType)),
      },
      {
        title: "Campaign sites",
        sites: sites.filter((site) => site.type.includes("campaign" as SiteType)),
      },
      {
        title: "ARM sites",
        sites: sites.filter((site) => site.type.includes("arm" as SiteType)),
      },
    ];
  }

  clickRow(site: Site) {
    this.$router.push({ name: "Site", params: { siteid: site.id } });
  }
}
</script>
