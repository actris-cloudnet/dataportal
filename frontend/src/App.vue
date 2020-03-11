<template>
  <div id="app">
    <app-header/>
    <keep-alive include="Search">
      <router-view/>
    </keep-alive>
  </div>
</template>

<style lang="sass">
@import "@/sass/variables.sass"
@import "~bootstrap/dist/css/bootstrap.css"
@import "~bootstrap-vue/dist/bootstrap-vue.css"

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
