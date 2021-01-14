<style lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"

.map
  height: 300px
  width: 300px

.wrapper
  position: relative

</style>
<template>
  <div id="mapContainer" ref="mapElement" class="container wrapper" style="z-index: 4">
    <div class="row">
      <div class="col-md-12 no-padding">
        <div id="map" class="map"></div>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import L, {marker} from 'leaflet'
import {getMarkerUrl, getShadowUrl} from '../lib'
import {Site} from '../../../backend/src/entity/Site'

@Component
export default class Map extends Vue {
  @Prop() sites!: Site[]
  @Prop() selectedSiteIds?: string[]
  @Prop() onMapMarkerClick?: Function
  @Prop() zoom!: number
  @Prop() center!: [number, number]

  // map
  map: L.Map | null = null
  tileLayer: L.TileLayer | null = null
  allMarkers: { [key: string]: L.Marker } = {}

  marker = (color: string) => L.Icon.extend({
    options: {
      iconUrl: getMarkerUrl(color),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: getShadowUrl(),
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    }
  })

  markerColors: { [key: string]: string } = {
    'cloudnet': 'blue',
    'other': 'yellow',
    'arm': 'violet',
    'campaign': 'orange',
    'mobile': 'green',
    'active': 'red'
  }

  colorForSiteType(types: string[]) {
    const validType = types.filter(type => this.markerColors[type])[0] || 'other'
    return this.markerColors[validType]
  }

  initMap() {
    this.map = L.map(this.$refs['mapElement'] as HTMLElement).setView(this.center, this.zoom)
    this.tileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png')
    this.tileLayer.addTo(this.map)
  }

  initLayers() {
    this.sites.map(site => {
      const mark = marker([site.latitude, site.longitude])
      mark.setIcon(new (this.marker(this.colorForSiteType(site.type))))
      mark.on('click', (_onClick) => {
        if (this.onMapMarkerClick) this.onMapMarkerClick(site.id)
      })
      this.allMarkers[site.id] = mark
      if (!this.map) return
      mark.addTo(this.map)
    })
  }

  setActiveMarkers() {
    const keys = Object.keys(this.allMarkers)
    keys.forEach((id: string) => {
      const mark = this.allMarkers[id]
      if (this.selectedSiteIds && this.selectedSiteIds.includes(id)) {
        mark.setIcon(new (this.marker(this.markerColors.active)))
      }
      else {
        const site = this.sites.filter(site => site.id == id)[0]
        mark.setIcon(new (this.marker(this.colorForSiteType(site.type))))
      }
    })
  }

  mounted() {
    this.initMap()
    this.initLayers()
  }

  @Watch('selectedSiteIds')
  onSiteSelected() {
    this.setActiveMarkers()
  }
}
</script>
