<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/spinner.sass"

.availabilityviz
  margin-bottom: 2em

  h3
    text-align: center

.firstcolumn
  width: 50%
  float: left
  padding-right: 1em
  margin-bottom: $footer-height

.secondcolumn
  width: 50%
  float: right
  padding-left: 1em
  margin-bottom: $footer-height

.slider
  text-align: center
  height: 5em

.slider.disabled
  opacity: 0.2

.loadingoverlay.absolute
  position: relative
  top: -5em
  margin-bottom: -5em
  z-index: 4

</style>


<template>
  <main id="data_availability">
    <div class="slider">
      <label for="yearrange">Show last years:</label><br>
      1 <input type="range" id="yearrange" v-model="yearRange" min="1" max="11" step="1"
        :title="yearRange" @mouseup="refreshViz()"> All
    </div>
    <div class="firstcolumn" :key="allKey">
      <section class="availabilityviz" v-for="(site) in evenSites" :key="site.id">
        <h3>{{ site.humanReadableName }}</h3>
        <ProductAvailabilityVisualization
            v-if="readysites.includes(site.id)"
            :legend="false"
            :dataStatusParser="dataStatusParsers[site.id]"
            :downloadComplete="() => completedDownloads += 1">
        </ProductAvailabilityVisualization>
        <div v-else class="loadingoverlay">
          <div class="lds-dual-ring"></div>
        </div>
      </section>
    </div>
    <div class="secondcolumn" :key="allKey">
      <section class="availabilityviz" v-for="(site) in oddSites" :key="site.id">
        <h3>{{ site.humanReadableName }}</h3>
        <ProductAvailabilityVisualization
            v-if="readysites.includes(site.id)"
            :legend="false"
            :dataStatusParser="dataStatusParsers[site.id]"
            :downloadComplete="() => completedDownloads += 1">
        </ProductAvailabilityVisualization>
        <div v-else class="loadingoverlay">
          <div class="lds-dual-ring"></div>
        </div>
      </section>
    </div>
  </main>
</template>


<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import axios from 'axios'
import {Site, SiteType} from '../../../backend/src/entity/Site'
import ProductAvailabilityVisualization from '../components/DataStatusVisualization.vue'
import {DataStatusParser} from '../lib/DataStatusParser'

@Component({
  components: {ProductAvailabilityVisualization}
})
export default class DataAvailabilityView extends Vue {
  apiUrl = process.env.VUE_APP_BACKENDURL
  sites: Site[] = []
  completedDownloads = 0
  yearRange = '1'
  allKey = 0
  dateFrom = '1971-01-01'
  dataStatusParsers: { [key: string]: DataStatusParser } = {}
  readysites: string[] = []


  created() {
    axios.get(`${this.apiUrl}sites/`)
      .then(({data}) => {
        this.sites = data.filter((site: Site) => site.type.includes('cloudnet' as SiteType))
        this.refreshViz()
      })
  }

  get evenSites() {
    return this.sites.filter((site, index) => ! (index % 2))
  }

  get oddSites() {
    return this.sites.filter((site, index) => index % 2)
  }

  async refreshViz() {
    this.readysites = []
    const yearNow = new Date().getFullYear()
    const dateFromYear = this.yearRange === '11' ? 1971 : yearNow - parseInt(this.yearRange)
    this.dateFrom = `${dateFromYear}-01-01`
    this.completedDownloads = 0
    await Promise.all(this.sites.map(this.initDataStatusParser))
    this.allKey += 1
  }

  async initDataStatusParser(site: Site) {
    const properties = ['measurementDate', 'productId', 'legacy']
    const payload = {
      site: site.id,
      showLegacy: true,
      dateFrom: this.dateFrom,
      properties
    }
    this.dataStatusParsers[site.id] = await (new DataStatusParser(payload).engage())
    this.readysites.push(site.id)
  }
}
</script>
