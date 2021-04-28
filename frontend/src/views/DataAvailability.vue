<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"

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


</style>


<template>
  <main id="data_availability">
    <div class="firstcolumn">
      <section class="availabilityviz" v-for="(site, index) in evenSites" :key="site.id">
        <h3>{{ site.humanReadableName }}</h3>
        <ProductAvailabilityVisualization
            v-if="completedDownloads >= index * 2"
            :site="site.id"
            :legend="false"
            :downloadComplete="() => completedDownloads += 1">
        </ProductAvailabilityVisualization>
      </section>
    </div>
    <div class="secondcolumn">
      <section class="availabilityviz" v-for="(site, index) in oddSites" :key="site.id">
        <h3>{{ site.humanReadableName }}</h3>
        <ProductAvailabilityVisualization
            v-if="completedDownloads >= index * 2 + 1"
            :site="site.id"
            :legend="false"
            :downloadComplete="() => completedDownloads += 1">
        </ProductAvailabilityVisualization>
      </section>
    </div>
  </main>
</template>


<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import axios from 'axios'
import {Site, SiteType} from '../../../backend/src/entity/Site'
import ProductAvailabilityVisualization from '../components/ProductAvailabilityVisualization.vue'

@Component({
  components: {ProductAvailabilityVisualization}
})
export default class DataAvailabilityView extends Vue {
  apiUrl = process.env.VUE_APP_BACKENDURL
  sites: Site[] = []
  completedDownloads = 0

  created() {
    axios.get(`${this.apiUrl}sites/`)
    .then(({data}) => {
      this.sites = data.filter((site: Site) => site.type.includes('cloudnet' as SiteType))
    })
  }

  get evenSites() {
    return this.sites.filter((site, index) => ! (index % 2))
  }

  get oddSites() {
    return this.sites.filter((site, index) => index % 2)
  }
}
</script>
