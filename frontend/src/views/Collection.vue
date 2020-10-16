<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"

div.flex
  display: flex
  justify-content: center
  flex-wrap: wrap

main.column
  flex-direction: column
  margin-right: 80px
  margin-bottom: 40px
@media screen and (max-width: $narrow-screen)
  main.column
    margin-right: 0

.rightView
  flex-basis: 800px

  > h3
    margin-top: 2em
    margin-bottom: 0.5em
  > h3:nth-child(1)
    margin-top: 0

.internalNavi
  margin-bottom: 2em
  text-align: center

.router-link-active
  color: black
  font-weight: bold
  text-decoration: none
  cursor: default

</style>


<template>
  <main id="collectionlanding" v-if="!error && response">
    <img id="backButton" :src="require('../assets/icons/back.png')" @click="$router.back()">
    <header>
      <h2>{{ response.title || 'Custom collection' }}</h2>
    </header>
    <div class="flex">
      <main class="info column">
        <section id="summary">
          <header>Summary</header>
          <section class="details">
            <dl>
              <dt>Date span</dt>
              <dd>{{ startDate }} - {{ endDate }}</dd>
              <dt>File count</dt>
              <dd>{{ sortedFiles.length }}</dd>
              <dt>Total size</dt>
              <dd>{{humanReadableSize(combinedFileSize(this.sortedFiles)) }}</dd>
              <dt v-if="response.downloadCount">Download count</dt>
              <dd v-if="response.downloadCount">{{ response.downloadCount }}</dd>
            </dl>
          </section>
        </section>
        <section id="sitemap" v-if="sites.length > 0">
          <header>Sites</header>
          <section class="details">
            <Map
                :sites="sites"
                :center="[54.00, 14.00]"
                :zoom="3"
            ></Map>
          </section>
        </section>
        <section id="products">
          <header>Products</header>
          <section class="details">
            <div v-for="product in products" :key="product.id">
              <img :src="getIconUrl(product.id)" class="product">
              {{ product.humanReadableName }}
            </div>
          </section>
        </section>
      </main>
      <div class="rightView">
        <nav class="internalNavi">
          <router-link :to="{path: 'general'}" :replace="true" v-bind:class="{ 'router-link-active': mode === 'general' }">
            General
          </router-link> |
          <router-link :to="{path: 'files'}" :replace="true">All files</router-link>
        </nav>
        <section id="editCollection" class="rightView" v-if="mode === 'general'">
          <h3>Citing</h3>
          <a v-if="response.pid" :href="response.pid">{{response.pid }}</a>
          <span v-else>
          In order to cite this collection, you need to generate a persistent identifier for it.<br>
          <a class="secondaryButton" @click="generatePid()" v-bind:class="{ disabled: busy }">
            Generate persistent identifier
          </a>
          <div v-if="pidServiceError" class="errormsg">PID service is unavailable. Please try again later.</div>
        </span>
          <h3>License</h3>
          <!-- eslint-disable-next-line max-len -->
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          <h3>Download</h3>
          By clicking the download button below you agree to the terms<br>
          <a class="download" :href="downloadUrl">
            Download collection
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          </a>
        </section>
        <data-search-result
            v-else
            :simplifiedView="true"
            :apiResponse="sortedFiles"
            :isBusy="busy"
            :downloadUri="downloadUrl">
        </data-search-result>
      </div>
    </div>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>


<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import axios from 'axios'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'
import {CollectionResponse} from '../../../backend/src/entity/CollectionResponse'
import {combinedFileSize, getIconUrl, humanReadableSize, constructTitle} from '../lib'
import {Site} from '../../../backend/src/entity/Site'
import Map from '../components/Map.vue'
import {Product} from '../../../backend/src/entity/Product'
import DataSearchResult from '@/components/DataSearchResult.vue'

Vue.component('data-search-result', DataSearchResult)

@Component({
  components: {Map}
})
export default class CollectionView extends Vue {
  @Prop() uuid!: string
  @Prop() mode!: string
  error = false
  response: CollectionResponse | null = null
  sortedFiles: SearchFileResponse[] = []
  sites: Site[] = []
  products: Product[] = []
  apiUrl = process.env.VUE_APP_BACKENDURL
  busy = false
  pidServiceError = false

  combinedFileSize = combinedFileSize
  humanReadableSize = humanReadableSize
  getIconUrl = getIconUrl

  get startDate() {
    return this.sortedFiles[this.sortedFiles.length - 1].measurementDate
  }

  get endDate() {
    return this.sortedFiles[0].measurementDate
  }

  get downloadUrl() {
    if (!this.response) return null
    return `${this.apiUrl}download/${this.response.uuid}`
  }

  getUnique(field: keyof SearchFileResponse) {
    return this.sortedFiles
      .map(file => file[field])
      .reduce((acc: string[], cur) =>
        (typeof cur == 'string' && !acc.includes(cur))
          ? acc.concat([cur])
          : acc,
      [])
  }

  get size() {
    return combinedFileSize(this.sortedFiles)
  }

  async generatePid() {
    if (this.busy) return
    this.busy = true
    this.pidServiceError = false
    const payload = {
      type: 'collection',
      uuid: this.uuid
    }
    axios.post(`${this.apiUrl}generate-pid`, payload)
      .then(({data}) => {
        if (!this.response) return
        this.response.pid = data.pid
      })
      .catch(({response}) => {
        if (response.status == 504) this.pidServiceError = true
      })
      .finally(() => (this.busy = false))
  }

  created() {
    axios.get(`${this.apiUrl}collection/${this.uuid}`)
      .then(res => {
        this.response = res.data
        if (this.response == null) return
        this.sortedFiles = constructTitle(this.response.files
          .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime()))
      })
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
      .then(() => {
        const siteIds = this.getUnique('siteId')
        const productIds = this.getUnique('productId')
        return Promise.all([
          axios.get(`${this.apiUrl}sites/`),
          axios.get(`${this.apiUrl}products/`)
        ]).then(([sites, products]) => {
          this.sites = sites.data.filter((site: Site) => siteIds.includes(site.id))
          this.products = products.data.filter((product: Product) => productIds.includes(product.id))
        })
      })
      .catch(console.error)
  }
}
</script>
