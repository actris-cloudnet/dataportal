<style scoped lang="sass">
@import "@/sass/variables.sass"

footer
  display: flex
  justify-content: space-between
  box-sizing: border-box
  width: 100%
  height: 4.5em
  padding-left: 1em
  padding-right: 1em
  background: #fdfdfd
  box-shadow: 0 1px 3px rgba(0,0,0,0.3)
  z-index: 5
  position: absolute
  bottom: 0

.footeritem
  display: flex
  flex-direction: column
  justify-content: center
  font-family: $header-font
  color: darkgrey
  margin: 0
  line-height: 1
</style>

<template>
  <footer class="global">
    <div class="footeritem">
      &copy; Finnish Meteorological Institute
    </div>
    <div class="footeritem">
      Give feedback: <a href="mailto:actris-cloudnet-feedback@fmi.fi">actris-cloudnet-feedback@fmi.fi</a>
    </div>
  </footer>
</template>
