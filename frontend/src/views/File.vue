<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/visualizations.sass"
@import "../sass/landing.sass"

main#filelanding

  >header
    display: flex
    justify-content: space-between
    align-items: center
    flex-wrap: wrap
    position: relative

  div.actions
    margin-top: 5px
    margin-bottom: 5px

  .volatilenote
    border-color: #cad7ff
    background: #eef2ff

  .versionnote
    border-color: #fff2ca
    background: #fffdee

  .legacynote
    border-color: #d7d7d7
    background: #f7f7f7

  section#preview.wide
    flex-basis: 100%

  .history
    flex-grow: 1
    flex-direction: column
    display: flex
    justify-content: space-between
    align-items: flex-start

  .monospace
    white-space: pre-wrap
    font-family: monospace
    width: 100%
    display: block

  #preview
    flex-basis: 600px
    img
      width: 100%
      height: auto

  a.viewAllPlots
    cursor: pointer
  a.viewAllPlots:hover
    color: #0056b3
    text-decoration: underline

  .hoverbox
    position: absolute
    right: -1em
    margin-right: 1em
    margin-top: 1em
    margin-bottom: 1em
    z-index: 100
    background: white
    max-width: 53em
    padding: 1em
    border: 1px solid $border-color
    border-radius: 3px
    box-shadow: 3px 3px 3px rgba(0,0,0,0.1)
    .closeX
      font-style: normal

.capitalize
  text-transform: capitalize

.na
  color: grey

.download:focus, .secondaryButton:focus
  outline: thin dotted black

.secondaryButton
  margin-right: 1em

</style>


<template>
  <main id="filelanding" v-if="!error && response">
    <img alt="back" id="backButton" :src="require('../assets/icons/back.png')" @click="$router.back()">
    <header>
      <div class="summary">
          <h2>Cloudnet data object</h2>
          <span>
            {{ response.product.humanReadableName }} data from
            {{ response.site.humanReadableName }} on
            {{ humanReadableDate(response.measurementDate) }}.
          </span>
      </div>
      <div class="actions">
        <a class="secondaryButton"
          id="showCiting"
          v-bind:class="{active: showHowToCite, disabled: response.volatile}"
          @click="response.volatile ? null : ((showHowToCite = !showHowToCite) && (showLicense = false))"
          :title="response.volatile ? 'Citing information is not available for volatile files' : ''"
        >How to cite
        </a>
        <div class="hoverbox" v-if="showHowToCite">
          <span class="closeX" id="hideCiting" @click="showHowToCite = false"> &#10005; </span>
          <how-to-cite
              :pid="response.pid"
              :products="[response.product.humanReadableName]"
              :sites="[response.site.humanReadableName]"
              :startDate="response.measurementDate"
          ></how-to-cite>
        </div>
        <a class="secondaryButton"
           id="showLicense"
           v-bind:class="{active: showLicense}"
           @click="(showLicense = !showLicense) && (showHowToCite = false)"
        >License
        </a>
        <div class="hoverbox" v-if="showLicense">
          <span class="closeX" id="hideLicense" @click="showLicense = false"> &#10005; </span>
          <license></license>
        </div>
        <a class="download" :href="response.downloadUrl">
          Download file
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        </a>
      </div>
    </header>
    <div v-if="response.volatile" class="note volatilenote">
      This is a volatile file. The data in this file may be incomplete and update in real time.
    </div>
    <div v-if="response.legacy" class="note legacynote">
      This is legacy data. Quality of the data is not assured.
    </div>
    <div v-if="newestVersion" class="note versionnote">
      A <router-link id="newestVersion" :to="`/file/${newestVersion}`">newer version</router-link> of this file is available.
    </div>
    <main class="info">
      <section id="file">
        <header>File information</header>
        <section class="details">
          <dl>
            <dt>PID</dt>
            <dd v-if="response.pid.length > 2"> <a :href=response.pid> {{ response.pid }} </a></dd>
            <dd v-else class="notAvailable"></dd>
            <dt>Filename</dt>
            <dd>{{ response.filename }}</dd>
            <dt>Format</dt>
            <dd>{{ response.format }}</dd>
            <dt>Size</dt>
            <dd>{{ response.size }} bytes ({{ humanReadableSize(response.size) }})</dd>
            <dt>Hash (SHA-256)</dt>
            <dd>{{ response.checksum }}</dd>
            <dt>Last modified</dt>
            <dd>{{ humanReadableTimestamp(response.updatedAt) }}</dd>
            <dt>Versions</dt>
            <dd>
              <router-link v-if="previousVersion" id="previousVersion" :to="`/file/${previousVersion}`">
                previous
              </router-link>
              <span v-if="previousVersion && nextVersion">-</span>
              <router-link v-if="nextVersion" id="nextVersion" :to="`/file/${nextVersion}`"> next</router-link>
              <span v-if="!previousVersion && !nextVersion" class="notAvailable"></span>
            </dd>
          </dl>
        </section>
      </section>
      <section id="data">
        <header>Product information</header>
        <section class="details">
          <dl>
            <dt>Product</dt>
            <dd class="capitalize">
              <img :alt="response.product.id" :src="getIconUrl(response.product.id)" class="product">
              {{ response.product.humanReadableName }}
            </dd>
            <dt>Level</dt>
            <dd>{{ response.product.level }}</dd>
            <dt>Quality</dt>
            <dd>Near Real Time (NRT)</dd>
            <dt v-if="response.cloudnetpyVersion">Software version</dt>
            <dd v-if="response.cloudnetpyVersion">
              CloudnetPy {{ response.cloudnetpyVersion }}
              <a href="https://github.com/actris-cloudnet/cloudnetpy/releases"><svg class="link"
                  fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="60px" height="60px"><path d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"/>
              </svg></a>
            </dd>
            <dt v-if="response.model">Model</dt>
            <dd v-if="response.model">
              {{ response.model.id }}
            </dd>
            <dt>Data from</dt>
            <dd>{{ response.measurementDate }}</dd>
          </dl>
        </section>
      </section>
      <section id="measurement">
        <header>Site information</header>
        <section class="details">
          <dl>
            <dt>Location</dt>
            <dd><router-link :to="`/site/${this.response.site.id}`">
              {{ response.site.humanReadableName }}, {{ response.site.country }}
            </router-link></dd>
            <dt>Coordinates</dt>
            <dd>{{ response.site.latitude }}&deg; N, {{ response.site.longitude }}&deg; E</dd>
            <dt>Site altitude</dt>
            <dd>{{ response.site.altitude }} m</dd>
          </dl>
        </section>
      </section>
      <section id="history">
        <header>History</header>
        <section class="details history">
          <div v-if="response.sourceFileIds && response.sourceFileIds.length > 0" class="detailslist">
            <span class="notice">This file was generated using the following files:<br></span>
            <div v-for="sourceFile in sourceFiles" :key="sourceFile.uuid" class="detailslistItem">
              <router-link :to="`/file/${sourceFile.uuid}`">
                <img :alt="sourceFile.product.id" :src="getIconUrl(sourceFile.product.id)" class="product">
                {{ sourceFile.product.humanReadableName }}
              </router-link><br>
            </div>
          </div>
          <div class="detailslistNotAvailable" v-else>Source file information not available.</div>
          <div v-if="showHistory">
            <span class="notice">Details:</span>
            <span class="monospace">{{ response.history.trim() }}</span>
            <span class="notice">This is a non-standardized history provided by the file creator/processor.
              <a href="" @click.prevent="showHistory = false" id="hideHistory">Hide details</a>.
            </span>
          </div>
          <a href="" @click.prevent="showHistory = true" id="showHistory" class="notice" v-else>Show details</a>
        </section>
      </section>
      <section id="preview" v-bind:class="{ wide: allVisualizations }">
        <header>Preview</header>
        <section class="details">
          <div v-if="visualizations.length" v-bind:class="{sourceFile: allVisualizations}">
            <div v-for="viz in getVisualizations(visualizations)"
                 :key="viz.productVariable.id" class="variable">
              <h4>{{ viz.productVariable.humanReadableName }}</h4>
              <img :alt="visualization" v-bind:src="`${quicklookUrl}${viz.s3key}`" class="visualization">
            </div>
          </div>
          <a v-if="visualizations.length > 1 && !allVisualizations"
             class="notice viewAllPlots"
             @click="allVisualizations = true">
            Show all plots
          </a>
          <a v-else-if="allVisualizations"
             class="notice viewAllPlots"
             @click="allVisualizations = false">
            Show one plot
          </a>
          <span v-else-if="visualizations.length === 0">Preview not available.</span>
        </section>
      </section>
    </main>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>


<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import axios from 'axios'
import {getIconUrl, humanReadableDate, humanReadableSize, humanReadableTimestamp, sortVisualizations} from '../lib'
import {DevMode} from '../lib/DevMode'
import {File} from '../../../backend/src/entity/File'
import {Visualization} from '../../../backend/src/entity/Visualization'
import HowToCite from '../components/HowToCite.vue'
import License from '../components/License.vue'

Vue.component('how-to-cite', HowToCite)
Vue.component('license', License)

@Component
export default class FileView extends Vue {
  @Prop() uuid!: string
  response: File | null = null
  visualizations: Visualization[] | [] = []
  versions: string[] = []
  error = false
  quicklookUrl = process.env.VUE_APP_QUICKLOOKURL
  apiUrl = process.env.VUE_APP_BACKENDURL
  humanReadableSize = humanReadableSize
  humanReadableDate = humanReadableDate
  humanReadableTimestamp = humanReadableTimestamp
  getIconUrl = getIconUrl
  sortVisualizations = sortVisualizations
  devMode = new DevMode()
  allVisualizations = false
  sourceFiles: File[] = []
  showHistory = false
  showHowToCite = false
  showLicense = false

  getVisualizations() {
    if (!this.allVisualizations) return this.visualizations.slice(0, 1)
    return this.visualizations
  }

  get currentVersionIndex() {
    if (this.response == null) return null
    const response = this.response
    return this.versions.findIndex(uuid => uuid == response.uuid)
  }

  get newestVersion() {
    if (!this.currentVersionIndex) return null
    return this.versions[0]
  }
  get previousVersion() {
    if (this.currentVersionIndex == null) return null
    return this.versions[this.currentVersionIndex + 1]
  }

  get nextVersion() {
    if (!this.currentVersionIndex) return null
    return this.versions[this.currentVersionIndex - 1]
  }

  created() {
    this.onUuidChange()
  }

  fetchVisualizations(payload: {}) {
    return axios
      .get(`${this.apiUrl}visualizations/${this.uuid}`, payload)
      .then(response => {
        this.visualizations = sortVisualizations(response.data.visualizations)
      })
      .catch()
  }

  fetchFileMetadata(payload: {}) {
    return axios
      .get(`${this.apiUrl}files/${this.uuid}`, payload)
      .then(response => {
        this.response = response.data
      })
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
  }

  fetchVersions(file: File) {
    // No need to reload versions
    if (this.versions.includes(file.uuid)) return
    const payload = {
      params: {
        developer: this.devMode.activated || undefined,
        site: file.site.id,
        product: file.product.id,
        dateFrom: file.measurementDate,
        dateTo: file.measurementDate,
        allVersions: true
      }
    }
    return axios
      .get(`${this.apiUrl}files`, payload)
      .then(response => {
        const searchFiles = response.data as File[]
        this.versions = searchFiles.map(sf => sf.uuid)
      })
  }

  fetchSourceFiles(response: File) {
    if (!response.sourceFileIds) return
    return Promise.all(response.sourceFileIds.map(uuid => axios.get(`${this.apiUrl}files/${uuid}`)))
      .then(response => this.sourceFiles = response.map(res => res.data))
  }

  @Watch('uuid')
  onUuidChange() {
    const payload = { params: { developer: this.devMode.activated || undefined}}
    return this.fetchFileMetadata(payload)
      .then(() => {
        if (this.response == null || this.error) return
        this.fetchVisualizations(payload)
        this.fetchVersions(this.response)
        this.fetchSourceFiles(this.response)
      })
  }
}
</script>
