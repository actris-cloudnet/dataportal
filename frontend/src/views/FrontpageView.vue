<template>
  <main id="frontpage">
    <header class="logos">
      <img alt="Actris logo" :src="actrisLogo" />
      <img alt="Cloudnet logo" :src="cloudnetLogo" />
    </header>
    <main>
      <h3>Welcome to ACTRIS Cloudnet data portal</h3>
      <p>
        The ACTRIS Cloudnet data portal provides a data processing and curation service for ground-based cloud remote
        sensing measurements. This includes centralised processing, quality control, provenance, data harmonisation and
        archiving.
      </p>
      <p>
        The data portal is developed by the Cloud Remote Sensing Data Centre Unit (CLU) as part of the
        <a href="https://www.actris.eu/">ACTRIS research infrastructure</a>, and is hosted at the
        <a href="https://en.ilmatieteenlaitos.fi/">Finnish Meteorological Institute</a>.
      </p>
      <div class="buttons">
        <BaseButton to="search/data" type="brand">
          <img alt="magnifying glass" :src="searchIcon" />
          Search and download data
        </BaseButton>
        <BaseButton to="search/visualizations" type="brand">
          <img alt="graph" :src="graphIcon" />
          View data visualisations
        </BaseButton>
        <BaseButton href="https://docs.cloudnet.fmi.fi" type="brand">
          <img alt="documents" :src="docsIcon" />
          Read documentation
        </BaseButton>
      </div>
      <div style="display: flex; justify-content: center">
        <BaseButton href="https://ccres.aeris-data.fr" type="secondary"> CCRES services &#8594; </BaseButton>
      </div>
    </main>
  </main>
</template>

<script lang="ts" setup>
import actrisLogo from "@/assets/logos/actris.svg";
import cloudnetLogo from "@/assets/logos/cloudnet.svg";
import searchIcon from "@/assets/icons/search-white.png";
import graphIcon from "@/assets/icons/graph-white.png";
import docsIcon from "@/assets/icons/docs-white.png";
import BaseButton from "@/components/BaseButton.vue";
</script>

<style scoped lang="scss">
main#frontpage {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  margin: 0 auto;
}

header img {
  max-height: 110px;
  width: auto;
  margin-left: 1em;
  margin-right: 1em;
}

main {
  text-align: justify;
  display: inline-block;
  max-width: 40em;
  width: 100%;
}

h3 {
  text-align: center;
  margin-bottom: 2em;
  margin-top: 2.5em;
  line-height: 2em;
}

p + p {
  margin-top: 0.5rem;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  justify-content: center;
  text-align: center;
  margin-top: 2em;
  margin-bottom: 1em;

  a {
    flex-direction: column;
    padding: 1em;
    width: 10em;
    height: 8em;
    flex-shrink: 0;

    img {
      width: 35px;
      height: auto;
      margin-bottom: 0.5em;
    }
  }
}
</style>
