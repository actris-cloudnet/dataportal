<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"

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
    max-width: 51em
    width: 100%
    h3
      text-align: center
      margin-bottom: 2em
      margin-top: 2.5em
      line-height: 2em

  .buttons
    text-align: center
    display: flex
    justify-content: center
    margin-top: 2em
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


<template>
  <main id="frontpage">
    <header class="logos">
      <img alt="Actris logo" src="../assets/actris_logo.gif">
      <img alt="Cloudnet logo" src="../assets/cloudnet_logo_large_2020.png">
    </header>
    <main>
      <h3>Welcome to the ACTRIS Data Centre node for cloud profiling (CLU).</h3>
      <!-- eslint-disable-next-line -->
CLU provides vertical profiles of cloud and turbulent properties at high temporal and spatial resolution from a network of ground-based stations using the Cloudnet processing suite. Major objectives also include the development and validation of new synergetic remote sensing algorithms, and the continuous evaluation of the representation of clouds and other atmospheric parameters in climate and weather forecast models.
      <!-- eslint-disable-next-line -->
This node is physically hosted by FMI in Helsinki, Finland. You can find our contact information and API documentation at the bottom of this page.
      <div class="buttons">
        <router-link to="search/visualizations" class="download">
          <img alt="graph" :src="require('../assets/icons/graph-white.png')"><br>
          View data visualizations
        </router-link>
        <router-link to="search/data" class="download">
          <img alt="magnifying glass" :src="require('../assets/icons/search-white.png')"><br>
          Search and download data
        </router-link>
        <a href="https://docs.cloudnet.fmi.fi" class="download">
          <img alt="documents" :src="require('../assets/icons/docs-white.png')"><br>
          Read documentation
        </a>
      </div>
    </main>
  </main>
</template>


