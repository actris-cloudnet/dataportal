<template>
  <div ref="mapContainer" class="map"></div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, watch, useTemplateRef } from "vue";
import L from "leaflet";

export interface Point {
  date: string;
  latitude: number;
  longitude: number;
}

export interface Props {
  site: string;
  track: Point[];
}

const props = defineProps<Props>();

const mapContainer = useTemplateRef("mapContainer");
let leafletInstance: L.Map | null = null;

onMounted(() => {
  if (!mapContainer.value) return;
  leafletInstance = L.map(mapContainer.value).setView([54.0, 14.0], 3);
  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png").addTo(
    leafletInstance,
  );
  let objects: L.Layer[] = [];
  watch(
    () => props.track,
    () => {
      if (!mapContainer.value || !leafletInstance) return;
      objects.forEach((object) => object.remove());
      objects = [];
      if (!props.track) return;
      const polyline = L.polyline(
        props.track.map((p) => [p.latitude, p.longitude]),
        { color: "steelblue", weight: 1, dashArray: "4" },
      ).addTo(leafletInstance);
      leafletInstance.fitBounds(polyline.getBounds());
      objects.push(polyline);
      for (const p of props.track) {
        const point = L.circleMarker([p.latitude, p.longitude], {
          radius: 2,
          stroke: false,
          color: "darkblue",
          fillOpacity: 1,
        }).addTo(leafletInstance);
        const hoverArea = L.circleMarker([p.latitude, p.longitude], {
          radius: 10,
          opacity: 0,
          fillOpacity: 0,
        })
          .bindTooltip(p.date)
          .on("click", () => {
            document.location =
              "/search/data?" +
              new URLSearchParams({
                site: props.site,
                dateFrom: p.date,
                dateTo: p.date,
              });
          })
          .addTo(leafletInstance);
        objects.push(point, hoverArea);
      }
    },
    { immediate: true },
  );
});

onBeforeUnmount(() => {
  leafletInstance?.remove();
});
</script>

<style scoped lang="scss">
.map {
  width: 100%;
  height: 100%;
}
</style>
