<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"

main#frontpage
  text-align: center
  display: flex
  flex-direction: column
  align-items: center

  header
    img
      max-height: 120px
      width: auto
      margin-left: 1em
      margin-right: 1em
  main
    text-align: justify
    display: inline-block
    max-width: 40em
    width: 100%
    h3
      text-align: center
      margin-bottom: 2em
      margin-top: 2.5em
      line-height: 2em

  .buttons
    text-align: center
    margin-top: 2em
    margin-bottom: 1em
    a
      margin: 1em
      padding: 1em
      width: 10em
      height: 8em
      flex-shrink: 0
      img
        width: 35px
        height: auto
        margin-bottom: 0.5em
    a:focus
      outline: thin dotted black
</style>

<script lang="ts" setup>
import actrisLogo from "@/assets/logos/actris.svg";
import cloudnetLogo from "@/assets/logos/cloudnet.svg";
import searchIcon from "@/assets/icons/search-white.png";
import graphIcon from "@/assets/icons/graph-white.png";
import docsIcon from "@/assets/icons/docs-white.png";
</script>

<template>
  <main id="frontpage">
    <header class="logos">
      <img alt="Actris logo" :src="actrisLogo" />
      <img alt="Cloudnet logo" :src="cloudnetLogo" style="padding-top: 2em" />
    </header>
    <main>
      <h3>Welcome to ACTRIS Cloudnet data portal</h3>
      <p>
        The ACTRIS Cloudnet data portal provides data processing and curation
        service of ground-based cloud remote sensing measurements. This includes
        centralized processing, quality control, provenance, data harmonization
        and archiving.
      </p>
      <p>
        The data portal is developed by the Cloud remote sensing data centre
        unit (CLU) as part of the
        <a href="https://www.actris.eu/">ACTRIS</a> research infrastructure, and
        operated at the
        <a href="https://en.ilmatieteenlaitos.fi/"
          >Finnish Meteorological Institute</a
        >.
      </p>
      <div class="buttons">
        <router-link to="search/data" class="download">
          <img alt="magnifying glass" :src="searchIcon" /><br />
          Search and download data
        </router-link>
        <router-link to="search/visualizations" class="download">
          <img alt="graph" :src="graphIcon" /><br />
          View data visualizations
        </router-link>
        <a href="https://docs.cloudnet.fmi.fi" class="download">
          <img alt="documents" :src="docsIcon" /><br />
          Read documentation
        </a>
      </div>
    </main>
    <div class="publications">
      <router-link to="/sites"> Measurement sites &#8594; </router-link><br />
      <router-link to="/publications">
        Cloudnet publications &#8594;
      </router-link>
    </div>
  </main>
</template>
