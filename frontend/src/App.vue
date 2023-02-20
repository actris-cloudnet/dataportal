<style lang="sass">

// Import external css first to prevent overriding styles later

@import "bootstrap/scss/functions"
@import "bootstrap/scss/variables"
@import "bootstrap/scss/mixins"
@import "bootstrap/scss/reboot"

@import "./assets/fonts/inter.css"
@import "./sass/variables.sass"
@import "./sass/global.sass"

html
  position: relative
  min-height: 100%

body
  margin: 0

#app
  display: flex
  flex-direction: column
  min-height: 100vh

#content
  flex: 1

  > main
    max-width: 100em
    margin: 3em auto
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
    <Header />
    <div id="content">
      <router-view v-slot="{ Component }">
        <keep-alive include="app-search">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
    <Footer />
    <div id="consent" v-if="askConsent">
      We monitor site traffic. Read our
      <router-link to="/privacy">privacy policy</router-link>.
      <button class="secondaryButton" @click="consent()">OK</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { ActiveConsent } from "./lib/ActiveConsent";
import Header from "./components/TheHeader.vue";
import Footer from "./components/TheFooter.vue";

const activeConsent = new ActiveConsent();
const askConsent = ref(activeConsent.askConsent);

function consent() {
  activeConsent.consent();
  askConsent.value = false;
}
</script>
