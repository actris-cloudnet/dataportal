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
import { ref, onMounted } from "vue";
import type { Ref } from "vue";
import axios from "axios";
import CustomMultiselect, { type Option } from "@/components/MultiSelect.vue";
import { useRouteQuery, queryStringArray } from "@/lib/useRouteQuery";
import { getInstrumentIcon, getProductIcon, backendUrl, compareValues } from "@/lib";
import { alphabeticalSort } from "@/lib/SearchUtils";
import type { Instrument, InstrumentInfo } from "@shared/entity/Instrument";

type InstrumentPidOption = Option & { type: string };

const allInstruments: Ref<Instrument[]> = ref([]);
const allInstrumentPids: Ref<InstrumentPidOption[]> = ref([]);

const selectedInstrumentIds = useRouteQuery({ name: "instrument", defaultValue: [], type: queryStringArray });
const selectedInstrumentPids = useRouteQuery({ name: "instrumentPid", defaultValue: [], type: queryStringArray });

const instrumentSort = (a: Instrument, b: Instrument) =>
  a.type == b.type
    ? compareValues(a.shortName || a.humanReadableName, b.shortName || b.humanReadableName)
    : compareValues(a.type, b.type);

onMounted(async () => {
  const [instruments, pids] = await Promise.all([
    axios.get<Instrument[]>(`${backendUrl}instruments`),
    axios.get<InstrumentInfo[]>(`${backendUrl}instrument-pids`),
  ]);

  allInstruments.value = instruments.data.sort(instrumentSort);
  allInstrumentPids.value = pids.data
    .map((obj) => ({ id: obj.pid, humanReadableName: obj.name, type: obj.instrument.type }))
    .sort(alphabeticalSort);
});
</script>
