<template>
  <main v-if="canRead" class="pagewidth">
    <div class="logbook-header">
      <h2>Logbook</h2>
      <BaseButton v-if="canEdit" type="primary" @click="showModal = true">Add entry</BaseButton>
    </div>

    <div v-if="state === 'loading'">Loading...</div>
    <div v-else-if="state === 'error'" class="error">Failed to load logbook entries.</div>
    <template v-else>
      <div v-if="entries.length > 0" class="table-scroll">
        <table class="logbook-table">
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('date')">Date (UTC){{ sortIndicator("date") }}</th>
              <th class="sortable" @click="toggleSort('eventType')">Event type{{ sortIndicator("eventType") }}</th>
              <th>Result</th>
              <th>Notes</th>
              <th class="sortable" @click="toggleSort('createdBy')">Added by{{ sortIndicator("createdBy") }}</th>
              <th v-if="canEdit"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in paginatedEntries" :key="entry.id">
              <td class="nowrap">{{ formatDateRange(entry) }}</td>
              <td class="nowrap">
                {{ formatEventType(entry.eventType) }}<template v-if="entry.detail"> ({{ entry.detail }})</template>
              </td>
              <td class="nowrap">
                <span v-if="entry.result" :class="'result-' + entry.result.toLowerCase()">{{ entry.result }}</span>
                <template v-else>–</template>
              </td>
              <td>
                <div class="notes">{{ entry.notes ?? "–" }}</div>
                <div v-if="entry.images.length > 0" class="image-thumbs">
                  <img
                    v-for="img in entry.images"
                    :key="img.id"
                    :src="`${backendUrl}instrument-logs/${entry.id}/images/${img.id}`"
                    :alt="img.filename"
                    :title="img.filename"
                    class="thumb"
                    @click="openImage(entry.id, img.id)"
                  />
                </div>
              </td>
              <td :title="formatTimestamp(entry)">
                {{ entry.createdBy?.fullName ?? entry.createdBy?.username ?? "–" }}
              </td>
              <td v-if="canEdit" class="nowrap">
                <span class="actions">
                  <BaseButton type="secondary" size="small" @click="modifyEntry(entry)">Edit</BaseButton>
                  <BaseButton type="danger" size="small" @click="deleteEntry(entry.id)">Delete</BaseButton>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <BasePagination
        v-if="entries.length > 0 && totalPages > 1"
        class="pagination"
        v-model="currentPage"
        :totalPages="totalPages"
        :disabled="false"
      />
      <div v-if="entries.length === 0" class="no-data">No logbook entries for this instrument.</div>
    </template>

    <BaseModal :open="showModal" @submit="submitEntry">
      <template #header>
        <h3>{{ editingEntryId ? "Edit logbook entry" : "Add logbook entry" }}</h3>
      </template>
      <template #body>
        <div class="form-group">
          <label for="event-type">Event type</label>
          <select id="event-type" v-model="form.eventType" required>
            <option value="" disabled>Select event type...</option>
            <option value="calibration">Calibration</option>
            <option value="check">Check</option>
            <option value="installation">Installation</option>
            <option value="maintenance">Maintenance</option>
            <option value="malfunction">Malfunction</option>
            <option value="note">Note</option>
            <option value="removal">Removal</option>
          </select>
        </div>
        <div class="form-group" v-if="availableDetails.length > 0">
          <label for="event-detail">Detail</label>
          <select id="event-detail" v-model="form.detail" required>
            <option value="" disabled>Select detail...</option>
            <option v-for="d in availableDetails" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="form-group" v-if="availableResults.length > 0">
          <label for="event-result">Result</label>
          <select id="event-result" v-model="form.result" required>
            <option value="" disabled>Select result...</option>
            <option v-for="r in availableResults" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ requiresTimeRange ? "Start date and time (UTC)" : "Date and time (UTC)" }}</label>
          <div class="date-time-row">
            <DatePicker name="event-date" v-model="form.date" :end="today" />
            <input id="event-time" type="time" v-model="form.time" :required="requiresTimeRange" />
            <BaseButton type="secondary" size="small" @click="setNow">Now</BaseButton>
            <BaseButton v-if="form.time" type="secondary" size="small" @click="form.time = ''">Clear</BaseButton>
          </div>
        </div>
        <div class="form-group" v-if="requiresTimeRange">
          <label>End date and time (UTC)</label>
          <div class="date-time-row">
            <DatePicker name="event-end-date" v-model="form.endDate" :end="today" />
            <input id="event-end-time" type="time" v-model="form.endTime" required />
            <BaseButton type="secondary" size="small" @click="setEndNow">Now</BaseButton>
            <BaseButton v-if="form.endTime" type="secondary" size="small" @click="form.endTime = ''">Clear</BaseButton>
          </div>
        </div>
        <div class="form-group">
          <label for="event-notes">{{ requiresNotes ? "Notes" : "Notes (optional)" }}</label>
          <textarea id="event-notes" v-model="form.notes" rows="6" :required="requiresNotes" />
        </div>
        <div class="form-group">
          <label>Images (optional, max 5)</label>
          <div v-if="existingImages.length > 0" class="existing-images">
            <div v-for="img in existingImages" :key="img.id" class="existing-image">
              <img
                :src="`${backendUrl}instrument-logs/${editingEntryId}/images/${img.id}`"
                :alt="img.filename"
                class="thumb"
              />
              <span class="image-filename">{{ img.filename }}</span>
              <BaseButton type="danger" size="small" @click="deleteExistingImage(img.id)">Remove</BaseButton>
            </div>
          </div>
          <div v-if="pendingFiles.length > 0" class="pending-images">
            <div v-for="(file, idx) in pendingFiles" :key="idx" class="pending-image">
              <img :src="pendingPreviews[idx]" :alt="file.name" class="thumb" />
              <span class="image-filename">{{ file.name }}</span>
              <BaseButton type="danger" size="small" @click="removePendingFile(idx)">Remove</BaseButton>
            </div>
          </div>
          <input
            v-if="existingImages.length + pendingFiles.length < 5"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            @change="onFilesSelected"
          />
        </div>
        <div v-if="uploadProgress" class="upload-progress">{{ uploadProgress }}</div>
        <div v-if="submitError" class="error">{{ submitError }}</div>
      </template>
      <template #footer>
        <BaseButton type="primary" html-type="submit" :disabled="submitting">{{
          submitting ? "Saving…" : "Save"
        }}</BaseButton>
        <BaseButton type="secondary" @click="cancelModal">Cancel</BaseButton>
      </template>
    </BaseModal>
  </main>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import axios from "axios";
import type { InstrumentInfo } from "@shared/entity/Instrument";
import type { InstrumentLog, InstrumentLogEventType, InstrumentLogImage } from "@shared/entity/InstrumentLog";
import {
  eventDetails,
  timeRangeDetails,
  resultOptions,
  notesRequiredEvents,
  notesRequiredDetails,
  notesRequiredResults,
} from "@shared/entity/InstrumentLogConfig";
import BaseModal from "@/components/BaseModal.vue";
import BaseButton from "@/components/BaseButton.vue";
import BasePagination from "@/components/BasePagination.vue";
import DatePicker from "@/components/DatePicker.vue";
import { backendUrl } from "@/lib";
import { hasInstrumentLogPermission } from "@/lib/auth";

const props = defineProps<{ instrumentInfo: InstrumentInfo }>();

const canRead = computed(
  () =>
    hasInstrumentLogPermission("canReadLogs", props.instrumentInfo.uuid).value ||
    hasInstrumentLogPermission("canWriteLogs", props.instrumentInfo.uuid).value,
);
const canEdit = computed(() => hasInstrumentLogPermission("canWriteLogs", props.instrumentInfo.uuid).value);

type PageState = "loading" | "ready" | "error";
const state = ref<PageState>("loading");
const entries = ref<InstrumentLog[]>([]);
const showModal = ref(false);
const submitError = ref<string | null>(null);
const submitting = ref(false);
const editingEntryId = ref<number | null>(null);
const pendingFiles = ref<File[]>([]);
const pendingPreviews = ref<string[]>([]);
const existingImages = ref<InstrumentLogImage[]>([]);
const deletedImageIds = ref<number[]>([]);
const uploadProgress = ref<string | null>(null);

const today = new Date().toISOString().slice(0, 10);

type SortKey = "date" | "eventType" | "createdBy";
type SortDir = "asc" | "desc";
const sortKey = ref<SortKey>("date");
const sortDir = ref<SortDir>("desc");

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = key === "date" ? "desc" : "asc";
  }
  currentPage.value = 1;
}

function sortIndicator(key: SortKey): string {
  if (sortKey.value !== key) return "";
  return sortDir.value === "asc" ? " \u25B2" : " \u25BC";
}

const sortedEntries = computed(() => {
  const dir = sortDir.value === "asc" ? 1 : -1;
  return [...entries.value].sort((a, b) => {
    let av: string, bv: string;
    if (sortKey.value === "date") {
      av = a.date;
      bv = b.date;
    } else if (sortKey.value === "eventType") {
      av = a.eventType;
      bv = b.eventType;
    } else {
      av = a.createdBy?.fullName ?? a.createdBy?.username ?? "";
      bv = b.createdBy?.fullName ?? b.createdBy?.username ?? "";
    }
    return av < bv ? -dir : av > bv ? dir : 0;
  });
});

const pageSize = 20;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(sortedEntries.value.length / pageSize));
const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return sortedEntries.value.slice(start, start + pageSize);
});

const instrumentType = props.instrumentInfo.instrument.type;

const defaultForm = () => ({
  eventType: "" as string as InstrumentLogEventType,
  detail: "",
  result: "",
  date: today as string | null,
  time: "",
  endDate: today as string | null,
  endTime: "",
  notes: "",
});

function formatDate(dateStr: string): string {
  const timePart = dateStr.slice(11, 16);
  if (timePart && timePart !== "00:00") {
    return `${dateStr.slice(0, 10)} ${timePart}`;
  }
  return dateStr.slice(0, 10);
}

function formatDateRange(entry: InstrumentLog): string {
  const start = formatDate(entry.date);
  if (!entry.endDate) return start;
  const startDay = entry.date.slice(0, 10);
  const endDay = entry.endDate.slice(0, 10);
  const endTime = entry.endDate.slice(11, 16);
  if (startDay === endDay && endTime) {
    return `${start} – ${endTime}`;
  }
  return `${start} – ${formatDate(entry.endDate)}`;
}

function setNow() {
  const now = new Date();
  form.value.date = now.toISOString().slice(0, 10);
  form.value.time = now.toISOString().slice(11, 16);
}

function setEndNow() {
  const now = new Date();
  form.value.endDate = now.toISOString().slice(0, 10);
  form.value.endTime = now.toISOString().slice(11, 16);
}

function formatTimestamp(entry: InstrumentLog): string {
  if (entry.updatedAt) {
    return `Updated on ${entry.updatedAt.slice(0, 10)} ${entry.updatedAt.slice(11, 16)} UTC`;
  }
  return `Added on ${entry.createdAt.slice(0, 10)} ${entry.createdAt.slice(11, 16)} UTC`;
}

function isInFuture(dateStr: string): boolean {
  return new Date(dateStr + "Z") > new Date();
}

function formatEventType(eventType: string): string {
  return eventType
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
const form = ref(defaultForm());

const availableDetails = computed(() => {
  const byType = eventDetails[instrumentType];
  if (!byType) return [];
  const items = byType[form.value.eventType] ?? [];
  return [...items].sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
});

const availableResults = computed(() => resultOptions[form.value.eventType] ?? []);
const requiresTimeRange = computed(() => timeRangeDetails.has(form.value.detail));
const requiresNotes = computed(
  () =>
    notesRequiredEvents.has(form.value.eventType) ||
    notesRequiredDetails.has(form.value.detail) ||
    notesRequiredResults.has(form.value.result),
);

watch(
  () => form.value.eventType,
  () => {
    form.value.detail = "";
    form.value.result = "";
  },
);

watch(
  () => form.value.detail,
  () => {
    if (!requiresTimeRange.value) {
      form.value.endDate = today;
      form.value.endTime = "";
    }
  },
);

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
  if (submitting.value) return;
  submitError.value = null;
  if (!form.value.date) {
    submitError.value = "Date is required.";
    return;
  }
  if (availableDetails.value.length > 0 && !form.value.detail) {
    submitError.value = "Detail is required for this event type.";
    return;
  }
  if (requiresTimeRange.value && !form.value.time) {
    submitError.value = "Start time is required.";
    return;
  }
  if (requiresNotes.value && !form.value.notes?.trim()) {
    submitError.value = "Notes are required for this event type.";
    return;
  }
  const dateStr = form.value.time ? `${form.value.date}T${form.value.time}` : form.value.date;
  if (isInFuture(dateStr)) {
    submitError.value = "Date and time cannot be in the future.";
    return;
  }
  let endDateStr: string | null = null;
  if (requiresTimeRange.value) {
    if (!form.value.endDate || !form.value.endTime) {
      submitError.value = "End date and time are required.";
      return;
    }
    endDateStr = `${form.value.endDate}T${form.value.endTime}`;
    if (new Date(endDateStr + "Z") < new Date(dateStr + "Z")) {
      submitError.value = "End date/time cannot be before start.";
      return;
    }
    if (isInFuture(endDateStr)) {
      submitError.value = "End date and time cannot be in the future.";
      return;
    }
  }
  submitting.value = true;
  try {
    const payload = {
      instrumentInfoUuid: props.instrumentInfo.uuid,
      eventType: form.value.eventType,
      detail: form.value.detail || null,
      result: form.value.result || null,
      date: dateStr,
      endDate: endDateStr,
      notes: form.value.notes || null,
    };
    let logId: number;
    if (editingEntryId.value) {
      await axios.put(`${backendUrl}instrument-logs/${editingEntryId.value}`, payload);
      logId = editingEntryId.value;
    } else {
      const res = await axios.post(`${backendUrl}instrument-logs`, payload);
      logId = res.data.id;
    }
    for (const imageId of deletedImageIds.value) {
      await axios.delete(`${backendUrl}instrument-logs/${logId}/images/${imageId}`);
    }
    deletedImageIds.value = [];
    if (pendingFiles.value.length > 0) {
      try {
        await uploadPendingImages(logId);
      } catch {
        submitError.value = "Entry saved but image upload failed. Close and re-edit to retry.";
        await fetchEntries();
        return;
      }
    }
    showModal.value = false;
    editingEntryId.value = null;
    form.value = defaultForm();
    existingImages.value = [];
    clearPendingFiles();
    await fetchEntries();
  } catch {
    submitError.value = "Failed to save entry. Please try again.";
  } finally {
    submitting.value = false;
  }
}

async function modifyEntry(entry: InstrumentLog) {
  editingEntryId.value = entry.id;
  existingImages.value = [...entry.images];
  deletedImageIds.value = [];
  clearPendingFiles();
  form.value = {
    eventType: entry.eventType,
    detail: "",
    result: "",
    date: entry.date.slice(0, 10),
    time: entry.date.slice(11, 16) || "",
    endDate: entry.endDate ? entry.endDate.slice(0, 10) : today,
    endTime: entry.endDate ? entry.endDate.slice(11, 16) : "",
    notes: entry.notes ?? "",
  };
  await nextTick();
  form.value.detail = entry.detail ?? "";
  form.value.result = entry.result ?? "";
  showModal.value = true;
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

function openImage(logId: number, imageId: number) {
  window.open(`${backendUrl}instrument-logs/${logId}/images/${imageId}`, "_blank");
}

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  const maxNew = 5 - existingImages.value.length - pendingFiles.value.length;
  const files = Array.from(input.files).slice(0, maxNew);
  for (const file of files) {
    pendingFiles.value.push(file);
    pendingPreviews.value.push(URL.createObjectURL(file));
  }
  input.value = "";
}

function removePendingFile(idx: number) {
  URL.revokeObjectURL(pendingPreviews.value[idx]);
  pendingFiles.value.splice(idx, 1);
  pendingPreviews.value.splice(idx, 1);
}

function deleteExistingImage(imageId: number) {
  existingImages.value = existingImages.value.filter((img) => img.id !== imageId);
  deletedImageIds.value.push(imageId);
}

async function uploadPendingImages(logId: number) {
  for (let i = 0; i < pendingFiles.value.length; i++) {
    const file = pendingFiles.value[i];
    uploadProgress.value = `Uploading image ${i + 1} of ${pendingFiles.value.length}...`;
    await axios.post(`${backendUrl}instrument-logs/${logId}/images?filename=${encodeURIComponent(file.name)}`, file, {
      headers: { "Content-Type": file.type },
    });
  }
  uploadProgress.value = null;
}

function clearPendingFiles() {
  pendingPreviews.value.forEach((url) => URL.revokeObjectURL(url));
  pendingFiles.value = [];
  pendingPreviews.value = [];
}

function cancelModal() {
  showModal.value = false;
  editingEntryId.value = null;
  form.value = defaultForm();
  existingImages.value = [];
  deletedImageIds.value = [];
  clearPendingFiles();
  submitError.value = null;
  uploadProgress.value = null;
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

.table-scroll {
  overflow-x: auto;
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
    white-space: nowrap;

    &.sortable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: #eaeaea;
      }
    }
  }

  .nowrap {
    white-space: nowrap;
  }

  .actions {
    display: inline-flex;
    gap: 0.5rem;

    :deep(.button.small) {
      padding: 0.25rem 0.75rem;
    }
  }
}

.pagination {
  margin-top: 1rem;
}

.date-time-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

    &:required:invalid {
      background-color: #fefce8;
    }
  }

  textarea {
    resize: vertical;
  }
}

.error {
  color: #c0392b;
  margin-top: 0.5rem;
}

.result-ok {
  color: #27ae60;
  font-weight: 600;
}

.result-fail {
  color: #c0392b;
  font-weight: 600;
}

.no-data {
  color: #666;
  margin-top: 1rem;
}

.notes {
  white-space: pre-wrap;
}

.image-thumbs {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
  opacity: 0.7;
}

.existing-images,
.pending-images {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.existing-image,
.pending-image {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.image-filename {
  font-size: 0.875rem;
  color: #555;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-progress {
  color: #2980b9;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
