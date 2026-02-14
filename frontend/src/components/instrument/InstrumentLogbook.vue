<template>
  <main class="pagewidth">
    <div class="logbook-header">
      <h2>Logbook</h2>
      <BaseButton v-if="canEdit" type="primary" @click="showModal = true">Add entry</BaseButton>
    </div>

    <div v-if="state === 'loading'">Loading...</div>
    <div v-else-if="state === 'error'" class="error">Failed to load logbook entries.</div>
    <template v-else>
      <table v-if="entries.length > 0" class="logbook-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Event type</th>
            <th>Notes</th>
            <th>Added by</th>
            <th v-if="canEdit"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.id">
            <td>{{ entry.date }}</td>
            <td>{{ entry.eventType }}</td>
            <td>{{ entry.notes ?? "–" }}</td>
            <td>{{ entry.createdBy?.fullName ?? entry.createdBy?.username ?? "–" }}</td>
            <td v-if="canEdit">
              <BaseButton type="danger" size="small" @click="deleteEntry(entry.id)">Delete</BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-data">No logbook entries for this instrument.</div>
    </template>

    <BaseModal :open="showModal" @submit="submitEntry">
      <template #header>
        <h3>Add logbook entry</h3>
      </template>
      <template #body>
        <div class="form-group">
          <label for="event-type">Event type</label>
          <select id="event-type" v-model="form.eventType" required>
            <option value="calibration">Calibration</option>
            <option value="maintenance">Maintenance</option>
            <option value="malfunction">Malfunction</option>
          </select>
        </div>
        <div class="form-group">
          <label for="event-date">Date</label>
          <input id="event-date" type="date" v-model="form.date" required />
        </div>
        <div class="form-group">
          <label for="event-notes">Notes (optional)</label>
          <textarea id="event-notes" v-model="form.notes" rows="3" />
        </div>
        <div v-if="submitError" class="error">{{ submitError }}</div>
      </template>
      <template #footer>
        <BaseButton type="primary" html-type="submit">Save</BaseButton>
        <BaseButton type="secondary" @click="cancelModal">Cancel</BaseButton>
      </template>
    </BaseModal>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import type { InstrumentInfo } from "@shared/entity/Instrument";
import type { InstrumentLog, InstrumentLogEventType } from "@shared/entity/InstrumentLog";
import BaseModal from "@/components/BaseModal.vue";
import BaseButton from "@/components/BaseButton.vue";
import { backendUrl } from "@/lib";
import { hasPermission } from "@/lib/auth";

const props = defineProps<{ instrumentInfo: InstrumentInfo }>();

const canEdit = hasPermission("canCalibrate");

type PageState = "loading" | "ready" | "error";
const state = ref<PageState>("loading");
const entries = ref<InstrumentLog[]>([]);
const showModal = ref(false);
const submitError = ref<string | null>(null);

const defaultForm = () => ({ eventType: "calibration" as InstrumentLogEventType, date: "", notes: "" });
const form = ref(defaultForm());

async function fetchEntries() {
  state.value = "loading";
  try {
    const res = await axios.get<InstrumentLog[]>(`${backendUrl}instrument-logs`, {
      params: { instrumentInfoUuid: props.instrumentInfo.uuid },
    });
    entries.value = res.data;
    state.value = "ready";
  } catch {
    state.value = "error";
  }
}

async function submitEntry() {
  submitError.value = null;
  try {
    await axios.post(`${backendUrl}instrument-logs`, {
      instrumentInfoUuid: props.instrumentInfo.uuid,
      eventType: form.value.eventType,
      date: form.value.date,
      notes: form.value.notes || null,
    });
    showModal.value = false;
    form.value = defaultForm();
    await fetchEntries();
  } catch {
    submitError.value = "Failed to save entry. Please try again.";
  }
}

async function deleteEntry(id: number) {
  if (!confirm("Delete this logbook entry?")) return;
  try {
    await axios.delete(`${backendUrl}instrument-logs/${id}`);
    await fetchEntries();
  } catch {
    alert("Failed to delete entry.");
  }
}

function cancelModal() {
  showModal.value = false;
  form.value = defaultForm();
  submitError.value = null;
}

onMounted(fetchEntries);
</script>

<style lang="scss" scoped>
.logbook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
  }
}

.logbook-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 0.5rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    font-weight: 600;
    background-color: #f5f5f5;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;

  label {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  select,
  input,
  textarea {
    padding: 0.4rem 0.6rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
  }

  textarea {
    resize: vertical;
  }
}

.error {
  color: #c0392b;
  margin-top: 0.5rem;
}

.no-data {
  color: #666;
  margin-top: 1rem;
}
</style>
