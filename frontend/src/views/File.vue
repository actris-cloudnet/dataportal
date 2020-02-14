<style scoped lang="sass">
@import "../sass/variables.sass"

main.landing
  >header
    margin-bottom: 3em
    display: flex
    justify-content: space-between
    align-items: center
    flex-wrap: wrap
    h2
      color: $section-title
      margin: 0px
    span 
      color: grey
      font-style: italic
  div.actions
    margin-top: 5px
    margin-bottom: 5px
  button.download
    background-color: $blue-sapphire
    border-radius: 3px
    color: white
    border-style: outset
    border-width: 2px
    border-color: $blue-sapphire
    padding-top: 5px
    padding-bottom: 5px
    padding-left: 10px
    padding-right: 10px
    font-size: 1em
    cursor: pointer
    font-family: $content-font
    &:hover 
      background-color: $blue-sapphire-light
      border-color: $blue-sapphire-light
    &:active 
      border-style: inset
      background-color: $blue-sapphire
      border-color: $blue-sapphire
  main    
    margin: -1em
    display: flex
    justify-content: center
    flex-wrap: wrap
    > section
      flex-grow: 0.5
      border: 1px solid grey
      border-radius: 3px
      box-shadow: 3px 3px 2px rgba(0,0,0,0.1)
      margin: 1em
      min-width: 20em
      > *
        padding: 10px
      > header
        background: #f5f7f8
        border-bottom: 1px solid grey
        font-size: 1.1em
      dl
        margin-top: 5px
        margin-bottom: 5px
        margin-left: 10px
        display: grid
        grid-template-columns: auto 4fr
        column-gap: 0.5em
        row-gap: 0.5em
      dt 
        text-align: right
        font-weight: 600
        max-width: 10em
      dt::after
        content: ": "
      dd 
        display: flex
        flex-direction: column
        justify-content: center
        text-align: left
        margin: 0
</style>


<template>
  <main class="landing">
    <header>
      <div class="summary">
          <h2>Cloudnet data object</h2>
          <span>Categorize data from Hyytiälä on 31.1.2020.</span>
          {{ uuid }}
          {{ metadata }}
      </div>
      <div class="actions">
        <button class="download">Download file</button>
      </div>
    </header>
    <main class="info">
      <section id="file">
        <header>File information</header>
        <section class="details">
          <dl>
            <dt>Identifier</dt>
            <dd>http://uri.com/uriuri</dd>
            <dt>File name</dt>
            <dd>qwerty.nc</dd>
            <dt>Type</dt>
            <dd>NetCDF4</dd>
            <dt>Size</dt>
            <dd>304004 bytes (304kB)</dd>
            <dt>Checksum</dt>
            <dd>8239f9assf8as9f87f7a9</dd>
          </dl>
        </section>
      </section>
      <section id="data">
        <header>Data information</header>
        <section class="details">
          <dl>
            <dt>Type</dt>
            <dd>NRT</dd>
            <dt>Level</dt>
            <dd>2</dd>
            <dt>Cloudnet file type</dt>
            <dd><span>Categorize</span></dd>
            <dt>Cloudnet version</dt>
            <dd>1.4</dd>
          </dl>
        </section>
      </section>
      <section id="data">
        <header>Measurement info</header>
        <section class="details">
          <dl>
            <dt>Site</dt>
            <dd>Hyytiälä, Finland</dd>
            <dt>Latitude</dt>
            <dd>128.3494848</dd>
            <dt>Longitude</dt>
            <dd>28.349489</dd>
            <dt>Altitude</dt>
            <dd>39m</dd>
            <dt>Date</dt>
            <dd>31.1.2020</dd>
          </dl>
        </section>
      </section>
      <section id="data">
        <header>Preview</header>
        <section class="details">
          Quicklook image not available
        </section>
      </section>
      <section id="data">
        <header>History</header>
      </section>
    </main>
  </main>
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import axios from 'axios'

@Component
export default class File extends Vue {
  @Prop() uuid!: string
  @Prop() metadata!: any

  mounted () {
    axios
      .get(`http://localhost:3000/file/${this.uuid}`)
      .then(response => (this.metadata = response))
      .catch(({response}) => console.dir(response))
  }
}
</script>