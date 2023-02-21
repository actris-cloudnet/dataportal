<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"
</style>

<template>
  <!-- eslint-disable max-len -->
  <section id="howtocite">
    This is an example of how to cite Cloudnet datasets. You may edit the text
    to suit publication standards.
    <div class="infobox infocolor">
      <h4>Data availability</h4>
      <div class="citationtext">
        The ground-based remote-sensing data used in this article are generated
        by the European Research Infrastructure for the observation of Aerosol,
        Clouds and Trace Gases (ACTRIS) and are available from the ACTRIS Data
        Centre using the following link: <a :href="pid">{{ pid }}</a
        >.
      </div>
      <h4>Acknowledgements</h4>
      <div class="citationtext">
        We acknowledge ACTRIS for providing the {{ datasetCreator }} dataset in
        this study, which was produced by the Finnish Meteorological Institute,
        and is available for download from
        <a href="https://cloudnet.fmi.fi/">https://cloudnet.fmi.fi/</a>.
        {{ uniqueCitations.map((cit) => cit.acknowledgements).join(" ") }}
      </div>
      <!--
[optional for ACTRIS sites .i.e. for discussion]
foreach SITE in SITES
The cloud radar, ceilometer and microwave radiometer data for [SITE] was provided by [PROVIDER]. [PROVIDER TEXT]
Additional text for Cloudnet data from ARM/NOAA/other sites:
* ARM *
The cloud radar, ceilometer and microwave radiometer data for the ARM site[s] used in this study ([SITES]) were obtained from the Atmospheric Radiation Measurement (ARM) user facility, managed by the Office of Biological and Environmental Research for the U.S. Department of Energy Office of Science.
* NOAA (Summit station, could be others in the future) *
The cloud radar, ceilometer and microwave radiometer data for the Summit Station were obtained from NOAA; overall programmatic and logistical support for was provided by the US National Science Foundation, with additional instrumental support provided by the NOAA Earth System Research Laboratories, the DOE Atmospheric Radiation Measurement Program, and Environment Canada.
* Other (European, campaign) stations *
The cloud radar, ceilometer and microwave radiometer data for [SITES] was provided by [PROVIDER]. [PROVIDER TEXT]
-->
      <h4>Citation</h4>
      <div class="citationtext">
        {{ datasetCreator }}: {{ allProductsText }}
        {{ startDate + (endDate ? ` to ${endDate}` : "") }}; from
        {{ sites.map((site) => site.humanReadableName).join(", ") }}. Generated
        by the cloud profiling unit of the ACTRIS Data Centre,
        <a :href="pid">{{ pid }}</a
        >, {{ year }}.
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Citation } from "@shared/entity/Citation";
import type { Site } from "@shared/entity/Site";
import type { Model } from "@shared/entity/Model";
import type { Product } from "@shared/entity/Product";
import { onMounted, ref, computed } from "vue";

export interface Props {
  pid: string;
  products: Product[];
  nonModelSiteIds: string[];
  startDate: string;
  endDate: string | null;
  collectionYear?: number;
  sites: Site[];
  models: Model[];
}

const props = defineProps<Props>();

const citations = ref<Citation[]>([]);

const year = computed(() => {
  if (props.collectionYear) return props.collectionYear;
  return new Date(props.startDate).getFullYear();
});

const datasetCreator = computed(() => `CLU (${year.value})`);

const uniqueCitations = computed(() => {
  const objs: Record<Citation["id"], Citation> = {};
  for (const cit of citations.value) {
    objs[cit.id] = cit;
  }
  return Object.values(objs);
});

const productsText = computed(() => {
  const products = props.products.filter(
    (prod) => parseInt(prod.level) > 1 || prod.id == "categorize"
  );
  if (!products.length) return "";
  return `cloud profiling product${products.length > 1 ? "s" : ""}: ${products
    .map((prod) => prod.humanReadableName)
    .join(", ")}; `;
});

const measurementsText = computed(() => {
  const measurements = props.products.filter(
    (prod) =>
      parseInt(prod.level) == 1 && prod.id != "categorize" && prod.id != "model"
  );
  if (!measurements.length) return "";
  return `cloud profiling measurements: ${measurements
    .map((prod) => prod.humanReadableName)
    .join(", ")}; `;
});

const modelsText = computed(() => {
  if (!props.models.length) return "";
  return `${props.models.map((model) => model.id).join(", ")} model data; `;
});

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const allProductsText = computed(() => {
  return capitalizeFirstLetter(
    `${productsText.value}${measurementsText.value}${modelsText.value}`
  );
});

onMounted(() => {
  const instrSites = props.sites.filter((site: Site) =>
    props.nonModelSiteIds.includes(site.id)
  );
  const getCitations = (obj: Site | Model) => obj.citations as Citation[];
  citations.value = instrSites
    .filter(getCitations)
    .map(getCitations)
    .concat(props.models.filter(getCitations).map(getCitations))
    .flat();
});
</script>
