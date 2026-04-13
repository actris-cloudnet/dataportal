<template>
  <div>
    <LandingHeader title="About" />
    <main class="pagewidth">
      <p>
        The ACTRIS Cloudnet data portal provides a data processing and curation service for ground-based remote sensing
        measurements of clouds and turbulent properties. The data portal includes centralised processing, quality
        control, provenance, harmonisation, and archiving of data from
        <router-link :to="{ name: 'Sites' }">a network of ground-based stations</router-link> run mainly by European
        research institutes and universities.
      </p>
      <p>
        Major objectives of the data portal include the development and validation of new synergetic remote sensing
        algorithms, the continuous evaluation of the representation of clouds and other atmospheric parameters in
        climate and weather forecast models, and serving as a reference data set in the validation of satellite
        measurements.
      </p>
      <p>
        Cloudnet originated as an <a href="https://cordis.europa.eu/project/id/EVK2-CT-2000-00065">EU FP5 project</a>,
        which ran from 2001 to 2005, and then continued on a voluntary basis. Since 2011, Cloudnet has been part of
        <a href="https://www.actris.eu">ACTRIS research infrastructure</a> supported by EU FP7 project
        <a href="https://cordis.europa.eu/project/id/262254">ACTRIS</a> and Horizon 2020 (FP8) projects
        <a href="https://doi.org/10.3030/654109">ACTRIS-2</a>, <a href="https://doi.org/10.3030/739530">ACTRIS-PPP</a>,
        and <a href="https://doi.org/10.3030/871115">ACTRIS-IMP</a>.
      </p>
      <p>
        The data portal is developed by the Cloud Remote Sensing Data Centre Unit (CLU) as part of the
        <a href="https://data.actris.eu/about">ACTRIS Data Centre</a> and in collaboration with
        <a href="https://ccres.aeris-data.fr">CCRES Central Facility</a>, and is hosted at the
        <a href="https://en.ilmatieteenlaitos.fi/">Finnish Meteorological Institute</a>.
      </p>
    </main>
  </div>
</template>

<script lang="ts" setup>
import LandingHeader from "@/components/LandingHeader.vue";
</script>

<style scoped lang="scss">
:deep(.pagewidth) {
  max-width: 800px;
}

p {
  margin-bottom: 1rem;
}
</style>
