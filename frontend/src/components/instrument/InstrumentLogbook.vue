<script setup lang="ts">
import { ref } from "vue";
import MultiSelect from "../MultiSelect.vue";
import DatePicker from "../DatePicker.vue";
import { dateToString } from "@/lib";
import BaseButton from "../BaseButton.vue";

const selectedStatus = ref(null);
const selectedOperation = ref(null);
const selectedDate = ref(dateToString(new Date()));

const schema = {
  cl61d: {
    maintenance: [
      {
        id: "cleanWindow",
        title: "Clean window",
        fields: [
          {
            id: "notes",
            label: "Notes",
            type: "textarea",
            required: false,
          },
        ],
      },
      {
        id: "terminationHood",
        title: "Termination hood",
        fields: [
          {
            id: "startTime",
            label: "Start time",
            type: "datetime",
          },
          {
            id: "stopTime",
            label: "Stop time",
            type: "datetime",
          },
        ],
      },
      {
        id: "replaceTransmitterModule",
        title: "Replace transmitter module",
        fields: [
          {
            id: "p1",
            label: "Factory laser power value of the old transmitter (p1)",
            type: "number",
          },
          {
            id: "p2",
            label: "Factory laser power value of the new transmitter (p2)",
            type: "number",
          },
          {
            id: "r",
            label: "Adjustment ratio for the transmitter power (r = p1 / p2)",
            type: "number",
          },
          {
            id: "c1",
            label: "Previous calibration scalar (c1)",
            type: "number",
          },
          {
            id: "c2",
            label: "New adjusted calibration scalar (c2 = r × c1)",
            type: "number",
          },
        ],
      },
    ],
  },
};
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
      <template v-if="selectedStatus == 'maintenance' && selectedOperation == 'replace-transmitter-module'">
        <label>
          Factory laser power value of the old transmitter (p1):<br />
          <input type="text" />
        </label>
        <label>
          Factory laser power value of the new transmitter (p2):<br />
          <input type="text" />
        </label>
        <label>
          Adjustment ratio for the transmitter power (r = p1 / p2):<br />
          <input type="text" />
        </label>
        <label>
          Previous calibration scalar (c1):<br />
          <input type="text" />
        </label>
        <label>
          New adjusted calibration scalar (c2 = r &times; c1):<br />
          <input type="text" />
        </label>
      </template>
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

label {
  display: block;
  margin-top: 0.5rem;
}

input[type="text"],
textarea {
  width: 200px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;

  &:focus-visible {
    border: 1px solid transparent;
    box-shadow: 0 0 0 2px slateblue;
  }

  &::placeholder {
    color: gray;
  }
}

textarea {
  width: 100%;
  margin-bottom: 0.5rem;
  height: 150px;
  resize: vertical;
}
</style>
