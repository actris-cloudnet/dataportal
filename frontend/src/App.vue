<template>
  <div id="app">
    <app-header/>
    <router-view/>
  </div>
</template>

<style lang="sass">
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
</style>
