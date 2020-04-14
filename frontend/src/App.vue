<template>
  <div id="app">
    <app-header/>
    <keep-alive include="app-search">
      <router-view/>
    </keep-alive>
  </div>
</template>

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
@import "@/sass/variables.sass"

body
    margin: 0

#app > main
    max-width: 100em
    margin-left: auto
    margin-right: auto
    margin-top: 3em
    padding-left: 5em
    padding-right: 5em
    font-family: $content-font

h1, h2, h3, h4, h5, h6
  line-height: 1
  font-weight: normal
</style>
