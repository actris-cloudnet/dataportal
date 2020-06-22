<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"

footer.global
  background: #fdfdfd
  box-shadow: 0 1px 3px rgba(0,0,0,0.3)
  z-index: 5
  position: absolute
  bottom: 0
  height: $footer-height
  display: grid
  grid-template-columns: repeat(3, 1fr)
  padding-top: 1em
  padding-bottom: 1em

@media screen and (max-width: $narrow-screen)
  footer.global
    display: flex
    flex-direction: column
    height: $footer-height-narrow


.footeritem
  font-family: $header-font
  color: darkgrey
  line-height: 1.1
  font-size: 95%
  text-align: center
  padding: 0
  margin: 0


.footeritem.no-width
  width: auto

.small a, .hidden-links a
  color: darkgrey

.small
  font-size: 0.6em


.align-right
  text-align: right
</style>

<template>
  <footer class="global">
    <div class="vertical-center footeritem">
      Contact:
      <a href="mailto:actris-cloudnet-feedback@fmi.fi">actris-cloudnet-feedback@fmi.fi</a>
      <a href="https://forum.cloudnet.fmi.fi/">Cloudnet forum</a>
    </div>
    <div class="vertical-center footeritem centered hidden-links">
      <span>&copy; <a href="https://en.ilmatieteenlaitos.fi/">Finnish Meteorological Institute</a></span><br>
      <span>Except where otherwise noted, content on this site is licensed under a <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> license.<br></span>
      <span class="small">Header photo by Flickr user @theaucitron, used under a CC license.<br>
      Icons from <a href="https://icons8.com/">icons8.com</a>.</span>
    </div>
    <div class="vertical-center footeritem">
      Development:
      <a href="https://actris-cloudnet.github.io/dataportal/">API documentation</a>
      <a href="https://github.com/actris-cloudnet/">GitHub organization</a>
    </div>
  </footer>
</template>
