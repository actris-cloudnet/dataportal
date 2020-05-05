<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"

footer
  background: #fdfdfd
  box-shadow: 0 1px 3px rgba(0,0,0,0.3)
  z-index: 5
  position: absolute
  bottom: 0

.footeritem
  font-family: $header-font
  color: darkgrey
  margin: 0
  line-height: 1
</style>

<template>
  <footer class="global">
    <div class="vertical-center footeritem">
      &copy; Finnish Meteorological Institute
    </div>
    <div class="vertical-center footeritem">
      Give feedback: <a href="mailto:actris-cloudnet-feedback@fmi.fi">actris-cloudnet-feedback@fmi.fi</a>
    </div>
  </footer>
</template>
