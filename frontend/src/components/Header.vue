<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"

header
  background-image: linear-gradient(to left, rgba(0,0,0,0.0), $header-background-color 70%), url('../assets/clouds3.jpg')
  opacity: 0.7
  background-position: right 0px top 20%
  background-repeat: no-repeat
  background-size: cover
  box-shadow: 0 1px 3px rgba(0,0,0,0.3)
  height: 4.5em

.portal-name
  cursor: pointer
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
    <div onclick="window.location = '/'" class="vertical-center portal-name">
      <h1>Cloudnet</h1>
      <span>data portal</span>
    </div>
  </header>
</template>
