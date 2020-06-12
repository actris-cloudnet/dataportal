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
      margin: 1em
  main
    text-align: justify
    display: inline-block
    max-width: 51em
    h3
      text-align: center
      line-height: 3em

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
      img
        width: 35px
        height: auto
        margin-bottom: 0.5em

</style>


<template>
  <main id="frontpage">
    <header class="logos">
      <img src="../assets/actris_logo.gif">
      <img src="../assets/cloudnet_logo_large_2020.png">
    </header>
    <main>
      <h3>Welcome to the ACTRIS Data Centre node for cloud profiling (CLU).</h3>
      <!-- eslint-disable-next-line -->
CLU provides vertical profiles of cloud and turbulent properties at high temporal and spatial resolution from a network of ground-based stations using the Cloudnet processing suite. Major objectives also include the development and validation of new synergetic remote sensing algorithms, and the continuous evaluation of the representation of clouds and other atmospheric parameters in climate and weather forecast models.
      <!-- eslint-disable-next-line -->
This node is physically hosted by FMI in Helsinki, Finland. You can find our contact information at the bottom of this page.
      <div class="buttons">
        <router-link to="search/visualizations" class="download">
          <img :src="require('../assets/icons/graph-white.png')"><br>
          View data visualizations
        </router-link>
        <router-link to="search/data" class="download">
          <img :src="require('../assets/icons/search-white.png')"><br>
          Search and download data
        </router-link>
      </div>
    </main>
  </main>
</template>


