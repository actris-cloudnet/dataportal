<style scoped lang="sass">
@import "@/sass/variables.sass"

header
  display: flex
  justify-content: space-between
  box-sizing: border-box
  width: 100%
  height: 4em
  padding-left: 1em
  padding-right: 1em
  background-color: $header-background-color
  background-image: linear-gradient(to left, rgba(0,0,0,0.0), $header-background-color),url('../assets/clouds.jpg')
  background-position: right 0px top 20%
  background-repeat: no-repeat
  background-size: 60% auto
  box-shadow: 0 1px 3px rgba(0,0,0,0.7)
.portal_name
  display: flex
  flex-direction: column
  justify-content: center
  font-family: $header-font
  color: white
  margin: 0
  line-height: 1
  &>h1
    display: inline
    margin: 0
  &>span
    font-size: 0.8em
    text-transform: uppercase
    text-align: center
    letter-spacing: .3em
</style>

<template functional>
  <header class="global">
    <div class="portal_name">
      <h1>Cloudnet</h1>
      <span>data portal</span>
    </div>
  </header>
</template>
