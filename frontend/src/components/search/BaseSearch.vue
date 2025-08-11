<template>
  <main id="search" :class="mainWidth">
    <div v-if="allSites && allSites.length > 0 && showAllSites" class="widemap">
      <SuperMap
        :sites="siteOptions"
        :selectedSiteIds="selectedSiteIds"
        :onMapMarkerClick="onMapMarkerClick"
        :center="[54.0, 14.0]"
        :zoom="2"
        showLegend
        enableBoundingBox
      />
    </div>
    <div id="searchContainer">
      <section id="sideBar">
        <div v-if="allSites && allSites.length > 0 && !showAllSites" class="smallmap">
          <SuperMap
            :sites="siteOptions"
            :selectedSiteIds="selectedSiteIds"
            :onMapMarkerClick="onMapMarkerClick"
            :center="[58.0, 14.0]"
            :zoom="2.5"
            enableBoundingBox
          />
        </div>
        <div class="filterbox">
          <CustomMultiselect
            label="Location"
            v-model="selectedSiteIds"
            :options="siteOptions"
            id="siteSelect"
            class="nobottommargin"
            :class="{ widemapmarginleft: showAllSites }"
            :multiple="true"
            :getIcon="getMarkerIcon"
          />
          <CheckBox class="checkbox" v-model="showAllSites" label="Show all sites" />
          <slot name="filters" />
        </div>
      </section>
      <div class="results">
        <slot name="results" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from "axios";
import type { Site } from "@shared/entity/Site";
import CustomMultiselect from "@/components/MultiSelect.vue";
import CheckBox from "@/components/CheckBox.vue";
import { backendUrl, getMarkerIcon } from "@/lib";
import SuperMap from "@/components/SuperMap.vue";
import { useRouteQuery, queryStringArray } from "@/lib/useRouteQuery";
import { alphabeticalSort } from "@/lib/SearchUtils";

type MainWidth = "wideView" | "pagewidth";

const props = defineProps<{
  mainWidth: MainWidth;
}>();

// site selector
const allSites = ref<Site[]>([]);
const selectedSiteIds = useRouteQuery({ name: "site", defaultValue: [], type: queryStringArray });
const showAllSites = ref(false);
const siteOptions = computed(() =>
  showAllSites.value ? allSites.value : allSites.value.filter((site) => site.type.includes("cloudnet")),
);
const renderComplete = ref(false);

onMounted(async () => {
  await initView();
  renderComplete.value = true;
});

onUnmounted(() => {});

async function initView() {
  const [sites] = await Promise.all([initSites()]);
  allSites.value = sites.sort(alphabeticalSort);

  showAllSites.value = selectedSiteIds.value.some((siteId) => {
    const site = allSites.value.find((site) => site.id === siteId);
    return site && !site.type.includes("cloudnet");
  });
}

async function initSites(): Promise<Site[]> {
  const res = await axios.get<Site[]>(`${backendUrl}sites/`, { params: { type: ["cloudnet", "campaign", "arm"] } });
  return res.data.filter((site) => !site.type.includes("hidden"));
}

function onMapMarkerClick(ids: string[]) {
  const union = selectedSiteIds.value.concat(ids);
  const intersection = selectedSiteIds.value.filter((id) => ids.includes(id));
  selectedSiteIds.value = union.filter((id) => !intersection.includes(id));
}
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

$lightpadding: 1rem;
$heavypadding: 5rem;
$filter-margin: 2em;

main#search {
  padding-left: $lightpadding;
  padding-right: $lightpadding;
}

#searchContainer {
  display: flex;
  justify-content: center;
}

main#search.mediumView {
  max-width: 90em;
}

main#search.wideView {
  max-width: none;
  padding-left: $heavypadding;
  padding-right: $heavypadding;
}

a:focus {
  outline: thin dotted;
}

section#sideBar {
  margin-right: 80px;
  width: 300px;
  padding: 2rem 0;
  flex-basis: 300px;
  flex-shrink: 0;
}

@media screen and (max-width: variables.$page-width) {
  main#search.wideView {
    padding-left: $lightpadding;
    padding-right: $lightpadding;
  }
}

@media screen and (max-width: variables.$narrow-screen) {
  #searchContainer {
    flex-direction: column;
    align-items: center;
  }

  .results {
    width: 100%;
  }

  section#sideBar {
    margin-right: 0;
  }
}

:deep(div.date) {
  display: grid;
  grid-template-columns: 42.5% 15% 42.5%;
  justify-items: center;
  row-gap: 0.5em;

  .date {
    outline: none;
  }
}

#noRes {
  font-size: 90%;
  color: gray;
}

#reset {
  cursor: pointer;
  text-decoration: underline;
  color: #bcd2e2;
  margin-top: 1rem;
  display: block;
}

.multiselect--disabled {
  .multiselect__select {
    background: none;
  }
}

.results {
  display: inline-flex;
  flex-grow: 1;
}

.widebutton {
  width: 100%;
  margin: 0 auto $filter-margin;

  &:focus {
    outline: thin dotted;
  }
}

.no-padding {
  padding: 0;
}

:deep(.quickselectors) {
  width: 100%;
  height: 27px;
  display: flex;
  margin-bottom: 0.6em;
  gap: 0.6rem;

  .quickBtn {
    color: black;
    height: 25px;
    padding: 10px;
    font-size: 80%;
    line-height: 0;
    margin-right: 0;
    border: 1px solid variables.$steel-warrior;
    border-radius: 3px;
    background-color: variables.$blue-dust;
    flex-grow: 1;
    text-align: center;

    &:hover {
      background-color: variables.$steel-warrior;
    }

    &:focus {
      outline: thin dotted;
    }

    &:active {
      outline: none;
    }
  }

  .activeBtn {
    background-color: variables.$steel-warrior;
    border: 1px solid darkgray;

    &:focus {
      outline: none;
    }
  }
}

:deep(.dateButtons) {
  width: 80%;
  height: 32px;
  display: flex;
  margin-left: 8em;

  .dateBtn:disabled {
    opacity: 0.5;
  }

  .dateBtn:hover:enabled {
    background-color: variables.$steel-warrior;
  }
}

span.centerlabel {
  line-height: 30px;
  font-size: 80%;
}

.widemap.wideviz {
  left: $heavypadding;
  right: $heavypadding;
}

.widemapmarginleft {
  margin-top: -20px;
}

.widemapmarginright {
  margin-top: 450px;
}

@media screen and (max-width: variables.$narrow-screen) {
  .widemapmarginright {
    margin-top: 0px;
  }
}

@media screen and (max-width: variables.$medium-screen) {
  .widemapmarginright {
    margin-top: 0px;
  }
}

.smallmap {
  height: 300px;
}

.widemap {
  height: 450px;
  margin-top: 1rem;
}

:deep(.filterbox) {
  margin-top: 1rem;
}

:deep(.checkbox) {
  margin-top: 0.25rem;
}

summary {
  margin-left: 15px;
  margin-top: 15px;
  cursor: pointer;
  list-style: disclosure-closed;
}

details[open] summary {
  list-style: disclosure-open;
}

.link-to-instrument-db {
  position: absolute;
  margin-top: 18px;
  margin-left: 117px;
  font-size: 80%;
  color: gray;
}

.link-to-instrument-db a {
  color: gray;
}
</style>
