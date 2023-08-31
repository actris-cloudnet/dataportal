<style lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"
@import "leaflet/dist/leaflet.css"
@import "leaflet-draw/dist/leaflet.draw.css"

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
  background: white
  color: black
  box-shadow: 0 3px 14px rgba(0,0,0,0.4)
  text-align: center
  padding-left: 1em
  padding-right: 1em

.custom-popup .leaflet-popup-content
  margin: 0.8em -0.2em
  line-height: 0.4
  font-size: 12px
  width: auto

.custom-popup .leaflet-popup-tip
  opacity: 0.8
  overflow: hidden

.fullHeight
  height: 100%
</style>

<template>
  <div id="mapContainer" ref="mapElement" class="container wrapper" :class="{ fullHeight }" style="z-index: 4">
    <div class="row">
      <div v-if="showLegend" id="map" class="widemap"></div>
      <div v-else id="map" class="map"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, onActivated, watch, ref, nextTick } from "vue";
import L from "leaflet";
import "leaflet-draw";
import type { Site, SiteType } from "@shared/entity/Site";
import { getMarkerIcon } from "@/lib";
import shadowIcon from "@/assets/markers/marker-shadow.png";

export interface Props {
  sites: Site[];
  selectedSiteIds?: string[];
  onMapMarkerClick?: Function;
  zoom: number;
  center: [number, number];
  showLegend?: boolean;
  fullHeight?: boolean;
  enableBoundingBox?: boolean;
}

const props = defineProps<Props>();

let map: L.Map | null = null;
let tileLayer: L.TileLayer | null = null;
const allMarkers: { [key: string]: L.Marker } = {};
const legend = new L.Control({ position: "topright" });
const mapElement = ref(HTMLElement);

const myMarker = (site: Site, selected: boolean) =>
  L.Icon.extend({
    options: {
      iconUrl: getMarkerIcon(site, selected),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: shadowIcon,
      shadowSize: [41, 41],
      shadowAnchor: [12, 41],
    },
  });

function getMapCenter() {
  // refactor me
  let center = props.center;
  if (props.showLegend) center = [34.0, 14.0];
  return center;
}

function setMapBounds() {
  const southWest = L.latLng(-90.0, -330.0);
  const northEast = L.latLng(90.0, 330.0);
  return L.latLngBounds(southWest, northEast);
}

const markerColors: Record<SiteType | "selected", string> = {
  selected: "red",
  cloudnet: "blue",
  arm: "violet",
  campaign: "orange",
  mobile: "gray",
  test: "hidden",
  hidden: "hidden",
};

function generateLegend() {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = "<h4>Site types</h4>";
  const ul = L.DomUtil.create("ul", "legendlist");
  for (const [type, className] of Object.entries(markerColors)) {
    const li = L.DomUtil.create("li", className);
    li.innerText = type;
    ul.appendChild(li);
  }
  div.appendChild(ul);
  return div;
}

function initMap() {
  legend.onAdd = generateLegend;
  map = L.map(mapElement.value as unknown as HTMLElement, {
    maxBounds: setMapBounds(),
  }).setView(getMapCenter(), props.zoom);
  tileLayer = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png");
  tileLayer.addTo(map);
  if (props.showLegend) legend.addTo(map);
}

function customPopup(site: Site) {
  return L.popup({
    closeButton: false,
    className: "custom-popup",
  }).setContent(site.humanReadableName);
}

function initLayers() {
  props.sites.map((site) => {
    if (site.latitude !== null && site.longitude !== null) {
      const mark = L.marker([site.latitude, site.longitude]); // CHANGED THESE ARGUMENTS
      mark.bindPopup(customPopup(site));
      mark.on("mouseover", () => {
        mark.openPopup();
      });
      mark.on("mouseout", () => {
        mark.closePopup();
      });
      mark.on("click", () => {
        if (props.onMapMarkerClick) props.onMapMarkerClick([site.id]);
        mark.closePopup();
      });
      allMarkers[site.id] = mark;
      if (!map) return;
      mark.addTo(map);
    }
  });
}

function initBoundingBoxTool() {
  const mappi = map;
  if (!mappi) return;

  // Initialise the FeatureGroup to store editable layers
  const editableLayers = new L.FeatureGroup();

  const drawPluginOptions = {
    position: "bottomleft" as "bottomleft",
    draw: {
      polygon: false as false,
      // disable toolbar item by setting it to false
      polyline: false as false,
      circle: false as false, // Turns off this drawing tool
      rectangle: {
        showArea: false,
        shapeOptions: {
          color: "#3c90ce",
        },
      },
      marker: false as false,
      circlemarker: false as false,
    },
    edit: {
      featureGroup: editableLayers, //REQUIRED!!
      remove: false as false,
      edit: false as false,
    },
  };

  L.drawLocal.draw.toolbar.buttons.rectangle = "Draw a bounding box";

  // Initialise the draw control and pass it the FeatureGroup of editable layers
  const drawControl = new L.Control.Draw(drawPluginOptions);
  mappi.addControl(drawControl);

  mappi.addLayer(editableLayers);

  mappi.on(L.Draw.Event.CREATED, (e) => {
    const keys = Object.keys(allMarkers);
    const clickedSites = keys.filter((key) =>
      L.latLngBounds(e.layer.getBounds()).contains(allMarkers[key].getLatLng()),
    );
    if (props.onMapMarkerClick && clickedSites.length) props.onMapMarkerClick(clickedSites);
  });

  mappi.on(L.Draw.Event.DRAWSTART, () => {
    nextTick(() => {
      if (props.onMapMarkerClick) props.onMapMarkerClick(props.selectedSiteIds);
    });
  });
}

function setMarkerIcons() {
  const keys = Object.keys(allMarkers);
  keys.forEach((id: string) => {
    const mark = allMarkers[id];
    const site = props.sites.filter((site) => site.id == id)[0];
    if (props.selectedSiteIds && props.selectedSiteIds.includes(id)) {
      mark.setIcon(new (myMarker(site, true))());
    } else {
      mark.setIcon(new (myMarker(site, false))());
    }
  });
}

onActivated(() => {
  if (!map) return;
  map.invalidateSize();
});

onMounted(() => {
  initMap();
  initLayers();
  setMarkerIcons();
  if (props.enableBoundingBox) initBoundingBoxTool();
});

onBeforeUnmount(() => {
  if (!map) return;
  map.remove();
});

watch(
  () => props.selectedSiteIds,
  () => {
    setMarkerIcons();
  },
);
</script>
