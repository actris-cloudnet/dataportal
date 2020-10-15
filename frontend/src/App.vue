<style lang="sass">

// Import external css first to prevent overriding styles later

@import "~bootstrap/scss/functions"
@import "~bootstrap/scss/variables"
@import "~bootstrap/scss/mixins"
@import "~bootstrap/scss/tables"
@import "~bootstrap/scss/pagination"
@import "~bootstrap/scss/reboot"
@import "~bootstrap/scss/utilities"
@import "~bootstrap-vue/dist/bootstrap-vue.min.css"

@import "~vue-multiselect/dist/vue-multiselect.min.css"
@import "./sass/variables.sass"

html
  position: relative
  min-height: 100%

body
  margin: 0

#app > main
  max-width: 100em
  margin: 3em auto calc(#{$footer-height} + 4em)
  padding-left: 5em
  padding-right: 5em
  font-family: $content-font


@media screen and (max-width: $narrow-screen)
  #app > main
    margin: 3em auto calc(#{$footer-height-narrow} + 4em)
    padding-left: 1em
    padding-right: 1em

#app > main.wide
  max-width: none

h1, h2, h3, h4, h5, h6
  line-height: 1
  font-weight: normal
</style>

<template>
  <div id="app">
    <app-header/>
    <keep-alive include="app-search">
      <router-view/>
    </keep-alive>
    <app-footer/>
  </div>
</template>
