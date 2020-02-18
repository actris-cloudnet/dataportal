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
      display: block
      color: grey
      font-style: italic
    span::first-letter
      text-transform: capitalize
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
      word-wrap: anywhere
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
    section#history > section
      white-space: pre-wrap
      font-family: monospace

.capitalize
  text-transform: capitalize

.na
  color: grey
</style>


<template>
  <main class="landing" v-if="!error">
    <header>
      <div class="summary">
          <h2>Cloudnet data object</h2>
          <span>{{ response.type }} data from {{ response.location }} on {{ formatDateString(response.measurementDate) }}.</span>
      </div>
      <div class="actions">
        <button class="download" v-on:click="navigate(fileserverUrl + response.filename)">Download file</button>
      </div>
    </header>
    <main class="info">
      <section id="file">
        <header>File information</header>
        <section class="details">
          <dl>
            <dt>Identifier</dt>
            <dd>{{ response.uuid }}</dd>
            <dt>Filename</dt>
            <dd>{{ response.filename }}</dd>
            <dt>Format</dt>
            <dd>{{ response.format }}</dd>
            <dt>Size</dt>
            <dd>{{ response.size }} bytes ({{ humanReadableSize(response.size) }})</dd>
            <dt>Checksum</dt>
            <dd>{{ response.checksum }}</dd>
          </dl>
        </section>
      </section>
      <section id="data">
        <header>Data information</header>
        <section class="details capitalize">
          <dl>
            <dt>Type</dt>
            <dd>TODO</dd>
            <dt>Level</dt>
            <dd>TODO</dd>
            <dt>Cloudnet file type</dt>
            <dd>{{ response.type }}</dd>
            <dt v-if="response.cloudnetpyVersion">Cloudnetpy version</dt>
            <dd v-if="response.cloudnetpyVersion">{{ response.cloudnetpyVersion }}</dd>
          </dl>
        </section>
      </section>
      <section id="measurement">
        <header>Measurement info</header>
        <section class="details capitalize">
          <dl>
            <dt>Site</dt>
            <dd>{{ response.location }}</dd>
            <dt>Latitude</dt>
            <dd>TODO</dd>
            <dt>Longitude</dt>
            <dd>TODO</dd>
            <dt>Altitude</dt>
            <dd>TODO</dd>
            <dt>Date</dt>
            <dd>{{ formatDateString(response.measurementDate) }}</dd>
          </dl>
        </section>
      </section>
      <section id="preview">
        <header>Preview</header>
        <section class="details">
          Quicklook image not available
        </section>
      </section>
      <section id="history">
        <header>History</header>
        <section class="details" v-if="response.history">{{ response.history.trim() }}
        </section>
        <section class="details na" v-else>N/A
        </section>
      </section>
    </main>
  </main>
  <app-error v-else :response="response"></app-error>
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import axios from 'axios'

@Component
export default class File extends Vue {
  @Prop() uuid!: string
  response = {}
  error = false
  fileserverUrl = 'http://localhost:4000/'

  created () {
    axios
      .get(`http://localhost:3000/file/${this.uuid}`)
      .then(response => {
        this.response = response.data
        })
      .catch(({response}) => {
        this.error = true
        this.response = response
      })

  }

  navigate (url: string) {
    window.location.href = url
  }

  formatDateString (date: string) {
    return new Date(date).toLocaleDateString('fi-FI')
  }

  humanReadableSize (size: number) {
    const i = Math.floor( Math.log(size) / Math.log(1024) )
    return ( size / Math.pow(1024, i) ).toFixed(1) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
  }
}
</script>