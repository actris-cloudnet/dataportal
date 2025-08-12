<template>
  <div class="filterbox">
    <CustomMultiselect
      label="Instrument model"
      v-model="instruments"
      :options="allInstruments"
      id="instrumentSelect"
      :multiple="true"
      :getIcon="getInstrumentIcon"
    />
  </div>

  <div class="filterbox">
    <CustomMultiselect
      label="Specific instrument"
      v-model="instrumentPids"
      :options="allInstrumentPids"
      :multiple="true"
      id="instrumentPidSelect"
      :getIcon="(option) => getProductIcon(option.type)"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useSearchStore } from "@/stores/search";
import CustomMultiselect from "@/components/MultiSelect.vue";
import { getInstrumentIcon, getProductIcon } from "@/lib";

const searchStore = useSearchStore();

const { instruments, instrumentPids, allInstruments, allInstrumentPids } = storeToRefs(searchStore);
const { fetchInstruments } = searchStore;

onMounted(() => {
  if (allInstruments.value.length === 0) {
    fetchInstruments();
  }
});
</script>
