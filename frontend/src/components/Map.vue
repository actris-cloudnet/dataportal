<style lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"

.map
  height: 300px
  width: 300px

.widemap
  height: 450px
  .wrapper
    top: -36px
    position: absolute
    left: 1em
    right: 1em

.wrapper
  position: relative
  top: -15px

.legend
  background: white
  padding: 0.5em
  opacity: 0.8
  border: 2px solid rgba(0,0,0,0.2)
  border-radius: 2px
  background-clip: padding-box

.legendlist
  list-style: none
  padding-left: 0
  margin-bottom: 0
  line-height: 1.2em
  li
    text-transform: capitalize
  li.violet
    /* for arm */
    text-transform: uppercase
  li:before
    content: '■ '
    font-size: 1.4em
  li.blue:before
    color: #4393d0
  li.yellow:before
    color: #ccc334
  li.violet:before
    color: #9b29cb
  li.orange:before
    color: #cc832c
  li.green:before
    color: #00B100
  li.red:before
    color: #cc2c47

.custom-popup .leaflet-popup-content-wrapper
    opacity: 0.7
    max-Width : 78px
    background: white
    color: black
    box-size: 10px 20px
    box-shadow: 0 3px 14px rgba(0,0,0,0.4)
    text-align: left
    font-size: 12px

.custom-popup .leaflet-popup-content
    margin: 10px 18px
    line-height: 0.4
    width: 80px
    margin-left: 0.8em

.custom-popup .leaflet-popup-tip
    opacity: 0.8
    overflow: hidden


</style>
<template>
  <div id="mapContainer" ref="mapElement" class="container wrapper" style="z-index: 4">
    <div class="row">
      <div v-if="showLegend" id="map" class="widemap"></div>
      <div v-else id="map" class="map"></div>
    </div>
  </div>
</template>


<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import L, {marker} from 'leaflet'
import {Site} from '../../../backend/src/entity/Site'


// static marker functions
const markerColors: { [key: string]: string } = {
  'selected': 'red',
  'cloudnet': 'blue',
  'arm': 'violet',
  'campaign': 'orange',
  'other': 'grey'
}

const getShadowIcon = () =>
  require('../assets/markers/marker-shadow.png')

const markerIconFromColor = (color: string) =>
  require(`../assets/markers/marker-icon-${color}.png`)

export function getMarkerIcon(site: Site, selected=false) {
  let validType: string
  if (selected) validType = 'selected'
  else validType = site.type.filter(type => markerColors[type])[0] || 'other'
  return markerIconFromColor(markerColors[validType])
}


@Component
export default class Map extends Vue {
  @Prop() sites!: Site[]
  @Prop() selectedSiteIds?: string[]
  @Prop() onMapMarkerClick?: Function
  @Prop() zoom!: number
  @Prop() center!: [number, number]
  @Prop() showLegend?: boolean

  // map
  map: L.Map | null = null
  tileLayer: L.TileLayer | null = null
  allMarkers: { [key: string]: L.Marker } = {}
  legend = new L.Control({position: 'topright'})

  // markers
  marker = (site: Site, selected: boolean) => L.Icon.extend({
    options: {
      iconUrl: getMarkerIcon(site, selected),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: getShadowIcon(),
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    }
  })

  // init
  initMap() {
    this.legend.onAdd = this.generateLegend
    this.map = L.map(this.$refs['mapElement'] as HTMLElement).setView(this.center, this.zoom)
    this.tileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png')
    this.tileLayer.addTo(this.map)
    if (this.showLegend) this.legend.addTo(this.map)
  }

  initLayers() {
    this.sites.map(site => {
      const mark = marker([site.latitude, site.longitude])
      mark.bindPopup(this.customPopup(site))
      mark.on('mouseover', (_hoverIn) => {
        mark.openPopup()
      })
      mark.on('mouseout', (_hoverOut) => {
        mark.closePopup()
      })
      mark.on('click', (_onClick) => {
        if (this.onMapMarkerClick) this.onMapMarkerClick(site.id)
        mark.closePopup()
      })
      this.allMarkers[site.id] = mark
      if (!this.map) return
      mark.addTo(this.map)
    })
  }

  customPopup(site: Site) {
    const popup = L.popup({
      closeButton: false,
      className: 'custom-popup'
    }).setContent(site.humanReadableName)
    return popup
  }

  setMarkerIcons() {
    const keys = Object.keys(this.allMarkers)
    keys.forEach((id: string) => {
      const mark = this.allMarkers[id]
      const site = this.sites.filter(site => site.id == id)[0]
      if (this.selectedSiteIds && this.selectedSiteIds.includes(id)) {
        mark.setIcon(new (this.marker(site, true)))
      }
      else {
        mark.setIcon(new (this.marker(site, false)))
      }
    })
  }

  generateLegend() {
    const div = L.DomUtil.create('div', 'legend')
    div.innerHTML = '<h4>Site types</h4>'
    const ul = L.DomUtil.create('ul', 'legendlist')
    for (const type in markerColors) {
      const li = L.DomUtil.create('li', markerColors[type])
      li.innerText = type
      ul.appendChild(li)
    }
    div.appendChild(ul)
    return div
  }

  mounted() {
    this.initMap()
    this.initLayers()
    this.setMarkerIcons()
  }

  @Watch('selectedSiteIds')
  onSiteSelected() {
    this.setMarkerIcons()
  }
}
</script>
