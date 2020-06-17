<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"

footer
  background: #fdfdfd
  box-shadow: 0 1px 3px rgba(0,0,0,0.3)
  z-index: 5
  position: absolute
  bottom: 0
  height: $footer-height

.footeritem
  font-family: $header-font
  color: darkgrey
  margin: 0
  line-height: 1.1
  font-size: 95%
  max-width: 30em

.small a, .hidden-links a
  color: darkgrey

.small
  font-size: 0.6em

.marginright
  margin-right: 1em

.centered
  text-align: center
</style>

<template>
  <footer class="global">
    <div class="vertical-center footeritem marginright hidden-links">
      <span>&copy; <a href="https://en.ilmatieteenlaitos.fi/">Finnish Meteorological Institute</a></span><br>
      <span>Except where otherwise noted, content on this site is licensed under a <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> license.<br></span>
      <span class="small">Header photo by Flickr user @theaucitron, used under a CC license.<br>
      Icons from <a href="https://icons8.com/">icons8.com</a>.</span>
    </div>
    <div class="vertical-center footeritem">
      Contact:
      <a href="mailto:actris-cloudnet-feedback@fmi.fi">actris-cloudnet-feedback@fmi.fi</a>
      <a href="https://forum.cloudnet.fmi.fi/">Cloudnet forum</a>
    </div>
  </footer>
</template>
