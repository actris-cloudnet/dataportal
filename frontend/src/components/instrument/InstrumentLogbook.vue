<script setup lang="ts">
import { ref } from "vue";
import MultiSelect from "../MultiSelect.vue";
import DatePicker from "../DatePicker.vue";
import { dateToString } from "@/lib";
import BaseButton from "../BaseButton.vue";

const selectedStatus = ref(null);
const selectedOperation = ref(null);
const selectedDate = ref(dateToString(new Date()));
</script>

<template>
  <main class="pagewidth">
    <form>
      <DatePicker name="date" label="Date" v-model="selectedDate" />
      <MultiSelect
        id="status"
        label="Status"
        v-model="selectedStatus"
        :options="[
          { id: 'operational', humanReadableName: 'Operational' },
          { id: 'maintenance', humanReadableName: 'Maintenance' },
          { id: 'not-operational', humanReadableName: 'Not operational' },
          { id: 'moved', humanReadableName: 'Moved' },
        ]"
        style="margin-top: 0.5rem"
      />
      <MultiSelect
        v-if="selectedStatus == 'maintenance'"
        id="operation"
        label="Operation"
        v-model="selectedOperation"
        :options="[
          { id: 'termination-hood', humanReadableName: 'Termination hood' },
          { id: 'replace-transmitter-module', humanReadableName: 'Replace transmitter module' },
          { id: 'other', humanReadableName: 'Other' },
        ]"
        style="margin-top: 0.5rem"
      />
      <label
        v-if="selectedStatus == 'maintenance' ? selectedOperation != null : selectedStatus != null"
        style="display: block; margin-top: 0.5rem"
      >
        Description
        <textarea
          :placeholder="selectedStatus == 'not-operational' ? 'Describe the issue...' : 'Additional information...'"
        ></textarea>
      </label>
      <div style="margin-top: 1rem; display: flex; gap: 1rem">
        <BaseButton type="danger"> Delete entry </BaseButton>
        <BaseButton type="secondary" style="margin-left: auto"> Cancel </BaseButton>
        <BaseButton type="primary"> Save entry </BaseButton>
      </div>
    </form>
  </main>
</template>

<style scoped lang="scss">
main {
  max-width: 600px;
}

textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  height: 150px;
  resize: vertical;

  &::placeholder {
    color: gray;
  }
}
</style>
