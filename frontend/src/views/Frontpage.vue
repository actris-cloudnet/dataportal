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
    margin-top: 2em
    display: inline-block
    max-width: 50em

  .buttons
    display: flex
    justify-content: center
    margin-top: 2em
    a
      margin: 1em
      padding: 1em
      width: 10em
      height: 8em
      img
        width: 30px
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
      Lorem ipsum dolor sit amet, veniam putent dignissim no cum. Et ludus oratio per, vidit perfecto dignissim ea vis.
      Illud decore corpora ne qui, cum sanctus praesent cu, eu sint porro nominati sed.
      Eu vix maluisset persecuti definitionem, natum assentior sed an, mundi delectus iracundia sit eu.
      Duo eu invenire accusamus consectetuer, sit ut sumo explicari, fabulas electram delicatissimi duo in.
      <div class="buttons">
        <router-link to="view" class="download">
          <img :src="require('../assets/icons/graph-white.png')"><br>
          View data visualizations
        </router-link>
        <router-link to="search" class="download">
          <img :src="require('../assets/icons/search-white.png')"><br>
          Search and download data
        </router-link>
      </div>
    </main>
  </main>
</template>


