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
@import "./sass/global.sass"

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
    <div id="consent" v-if="askConsent">
      We log and analyze site traffic. Read our <router-link to="/privacy">privacy policy</router-link>.
      <button class="secondaryButton" @click="consent()">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import {ActiveConsent} from './lib/ActiveConsent'
import {Vue} from 'vue-property-decorator'
import Component from 'vue-class-component'


@Component
export default class AppView extends Vue {
  activeConsent = new ActiveConsent()
  askConsent = this.activeConsent.askConsent

  consent() {
    this.activeConsent.consent()
    this.askConsent = false
  }
}

</script>
