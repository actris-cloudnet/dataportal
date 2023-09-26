<script lang="ts" setup>
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import ConceptPopup from "@/components/ConceptPopup.vue";
</script>

<template>
  <div id="app">
    <TheHeader />
    <div id="content">
      <router-view v-slot="{ Component }">
        <keep-alive include="app-search">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
    <TheFooter />
    <ConceptPopup />
  </div>
</template>

<style lang="sass">
@import "./sass/variables.sass"
@import "./sass/new-variables.scss"
@import "./sass/global.scss"

#app
  display: flex
  flex-direction: column
  min-height: 100vh

#content
  flex-grow: 1

  // > main
  //   max-width: $page-width
  //   margin: 0 auto
  //   padding-left: 5em
  //   padding-right: 5em
  //   box-sizing: content-box

#consent
  position: fixed
  background: white
  width: 100%
  bottom: 0
  text-align: center
  z-index: 100
  padding: 1em
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3)

  .secondaryButton
    margin-left: 2em


@media screen and (max-width: $narrow-screen)
  #app > main
    //margin: 3em auto calc(#{$footer-height-narrow} + 4em)
    padding-left: 1em
    padding-right: 1em

#app > main.wide
  max-width: none

h1, h2, h3, h4, h5, h6
  line-height: 1
  font-weight: normal
</style>
