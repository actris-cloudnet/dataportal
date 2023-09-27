<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/new-variables.scss"

footer
  background: #fdfdfd
  box-shadow: 0 1px 3px rgba(0,0,0,0.3)
  z-index: 5
  bottom: 0

.footeritem-container
  max-width: $page-width
  height: $footer-height
  margin: 0 auto
  display: grid
  grid-template-columns: repeat(3, 1fr)
  padding: 0 1rem
  box-sizing: content-box

@media screen and (max-width: $narrow-screen)
  .footeritem-container
    display: flex
    flex-direction: column
    height: auto
    padding: 1rem
    gap: 1rem

.footeritem
  color: darkgrey
  line-height: 1.1
  font-size: 95%
  text-align: center
  padding: 0
  margin: 0

.footeritem.no-width
  width: auto

.footeritem a:focus
  outline: thin dotted

.small a, .hidden-links a
  color: darkgrey

.small
  font-size: 0.6em

.align-right
  text-align: right
</style>

<template>
  <footer class="global">
    <div class="footeritem-container">
      <div class="vertical-center footeritem">
        Contact:
        <a href="mailto:actris-cloudnet@fmi.fi">actris-cloudnet@fmi.fi</a>
        <a href="https://github.com/actris-cloudnet/">GitHub organization</a>
      </div>
      <div class="vertical-center footeritem centered hidden-links">
        <span>&copy; <a href="https://en.ilmatieteenlaitos.fi/">Finnish Meteorological Institute</a></span
        ><br />
        <span class="small">
          <a href="https://www.flickr.com/photos/theaucitron/5810163712/">Header photo</a>
          by <a href="https://www.flickr.com/photos/theaucitron/">theaucitron</a>,
          <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a>.<br />
          Icons from <a href="https://icons8.com/">icons8.com</a>.
        </span>
      </div>
      <div class="vertical-center footeritem">
        <a href="https://docs.cloudnet.fmi.fi/api/data-portal.html">API documentation</a>
        <router-link to="/privacy">Privacy policy</router-link>
      </div>
    </div>
  </footer>
</template>
