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
        sensing measurements. <router-link :to="{ name: 'About' }">Read more →</router-link>
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
        <BaseButton href="https://docs.cloudnet.fmi.fi" type="secondary">
          <img alt="documents" :src="docsIcon" style="filter: invert()" />
          Documentation
        </BaseButton>
        <BaseButton href="https://ccres.aeris-data.fr" type="secondary" target="_blank">
          <img alt="documents" :src="contactsIcon" />
          CCRES services
        </BaseButton>
      </div>
      <h3>Latest news</h3>
      <NewsList />
    </main>
  </main>
</template>

<script lang="ts" setup>
import actrisLogo from "@/assets/logos/actris.svg";
import cloudnetLogo from "@/assets/logos/cloudnet.svg";
import searchIcon from "@/assets/icons/search-white.png";
import graphIcon from "@/assets/icons/graph-white.png";
import docsIcon from "@/assets/icons/docs-white.png";
import contactsIcon from "@/assets/icons/contacts.png";
import BaseButton from "@/components/BaseButton.vue";
import NewsList from "@/components/NewsList.vue";
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
  margin-bottom: 1em;
  margin-top: 2em;
  line-height: 2em;
  font-size: 115%;
}

p {
  hyphens: auto;
}

.buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
  justify-content: center;
  text-align: center;
  margin-top: 2em;
  margin-bottom: 1em;

  a {
    padding: 1rem;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;

    img {
      width: 2.5rem;
      height: auto;
      margin-bottom: 0.5rem;
    }
  }
}

.button.secondary {
  flex-direction: row;

  img {
    width: 2rem;
    height: auto;
    margin-bottom: 0;
    margin-right: 0.5rem;
  }
}
</style>
