<template>
  <main id="frontpage">
    <header class="logos">
      <img alt="Actris logo" :src="actrisLogo" />
      <img alt="Cloudnet logo" :src="cloudnetLogo" style="padding-top: 2em" />
    </header>
    <main>
      <h3>Welcome to ACTRIS Cloudnet data portal</h3>
      <p>
        The ACTRIS Cloudnet data portal provides data processing and curation service of ground-based cloud remote
        sensing measurements. This includes centralized processing, quality control, provenance, data harmonization and
        archiving.
      </p>
      <p>
        The data portal is developed by the Cloud remote sensing data centre unit (CLU) as part of the
        <a href="https://www.actris.eu/">ACTRIS research infrastructure</a>, and operated at the
        <a href="https://en.ilmatieteenlaitos.fi/">Finnish Meteorological Institute</a>.
      </p>
      <div class="buttons">
        <BaseButton to="search/data" type="primary">
          <img alt="magnifying glass" :src="searchIcon" />
          Search and download data
        </BaseButton>
        <BaseButton to="search/visualizations" type="primary">
          <img alt="graph" :src="graphIcon" />
          View data visualisations
        </BaseButton>
        <BaseButton href="https://docs.cloudnet.fmi.fi" type="primary">
          <img alt="documents" :src="docsIcon" />
          Read documentation
        </BaseButton>
      </div>
    </main>
    <div class="publications">
      <router-link to="/sites"> Measurement sites &#8594; </router-link><br />
      <router-link to="/publications"> Cloudnet publications &#8594; </router-link>
    </div>
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
  padding: 1rem;
  margin: 0 auto;
}

header img {
  max-height: 120px;
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
