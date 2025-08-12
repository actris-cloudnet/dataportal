<template>
  <div class="filterbox">
    <CustomMultiselect
      label="Instrument model"
      v-model="selectedInstrumentIds"
      :options="allInstruments"
      id="instrumentSelect"
      :multiple="true"
      :getIcon="getInstrumentIcon"
    />
  </div>

  <div class="filterbox">
    <CustomMultiselect
      label="Specific instrument"
      v-model="selectedInstrumentPids"
      :options="allInstrumentPids"
      :multiple="true"
      id="instrumentPidSelect"
      :getIcon="(option) => getProductIcon(option.type)"
    />
  </div>
</template>

<script setup lang="ts">
import CustomMultiselect from "@/components/MultiSelect.vue";
import { useRouteQuery, queryStringArray } from "@/lib/useRouteQuery";
import { getInstrumentIcon, getProductIcon } from "@/lib";
import { useInstruments } from "@/composables/useInstruments";

const { allInstruments, allInstrumentPids } = useInstruments();

const selectedInstrumentIds = useRouteQuery({ name: "instrument", defaultValue: [], type: queryStringArray });
const selectedInstrumentPids = useRouteQuery({ name: "instrumentPid", defaultValue: [], type: queryStringArray });
</script>
