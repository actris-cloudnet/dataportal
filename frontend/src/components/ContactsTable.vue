<template>
  <main class="pagewidth">
    <p :class="['description', { 'description-spaced': !canManage }]">
      Persons listed here are included as authors in data product citations.
    </p>
    <div v-if="canManage" class="contacts-header">
      <BaseButton type="primary" @click="openAddModal">Add contact</BaseButton>
    </div>

    <div v-if="state === 'loading'">Loading...</div>
    <div v-else-if="state === 'error'" class="load-error">Failed to load contacts.</div>
    <template v-else>
      <table v-if="contacts.length > 0" class="contacts-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>ORCID</th>
            <th v-if="canManage">Email</th>
            <th>Start date</th>
            <th>End date</th>
            <th v-if="canManage"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contact in contacts" :key="contact.id">
            <td>{{ contact.person.firstName }} {{ contact.person.lastName }}</td>
            <td>
              <a
                v-if="contact.person.orcid"
                :href="`https://orcid.org/${contact.person.orcid}`"
                target="_blank"
                rel="noopener noreferrer"
                >{{ contact.person.orcid }}</a
              >
              <template v-else>–</template>
            </td>
            <td v-if="canManage">{{ contact.person.email ?? "–" }}</td>
            <td>{{ contact.startDate ?? "–" }}</td>
            <td>{{ contact.endDate ?? "–" }}</td>
            <td v-if="canManage" class="nowrap">
              <span class="actions">
                <BaseButton type="secondary" size="small" @click="openEditModal(contact)">Edit</BaseButton>
                <BaseButton type="danger" size="small" @click="deleteContact(contact.id)">Delete</BaseButton>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-data">{{ emptyMessage }}</div>
    </template>

    <BaseModal :open="showDeleteModal" @submit="confirmDelete">
      <template #header>
        <h3>Delete contact</h3>
      </template>
      <template #body>
        <p>Are you sure you want to delete this contact? This action cannot be undone.</p>
        <p v-if="deleteError" class="error">{{ deleteError }}</p>
      </template>
      <template #footer>
        <BaseButton type="danger" html-type="submit" :disabled="deleting">{{
          deleting ? "Deleting…" : "Delete"
        }}</BaseButton>
        <BaseButton type="secondary" @click="cancelDelete">Cancel</BaseButton>
      </template>
    </BaseModal>

    <BaseModal :open="showModal" @submit="submitContact" @close="closeModal">
      <template #header>
        <h3>{{ editingContactId ? `Edit contact: ${form.firstName} ${form.lastName}` : "Add contact" }}</h3>
      </template>
      <template #body>
        <template v-if="!editingContactId">
          <PersonAutocomplete
            ref="personAutocomplete"
            v-model:first-name="form.firstName"
            v-model:last-name="form.lastName"
            :disabled="nameIsLocked"
            @select="onPersonSelected"
          />
        </template>
        <div class="form-group">
          <label for="orcid">ORCID iD (optional)</label>
          <input
            id="orcid"
            :value="form.orcid"
            type="text"
            placeholder="0000-0000-0000-0000"
            :disabled="editingContactId ? !!editingOrcidLocked : personIsAutoFilled"
            @input="form.orcid = ($event.target as HTMLInputElement).value.trim()"
          />
          <span v-if="orcidStatus === 'loading'" class="orcid-status orcid-loading">Looking up…</span>
          <span v-else-if="orcidStatus === 'found-db'" class="orcid-status orcid-found">{{
            editingContactId ? `${orcidVerifiedName} (database)` : "Auto-filled from database"
          }}</span>
          <span v-else-if="orcidStatus === 'found-orcid'" class="orcid-status orcid-found">{{
            editingContactId ? `${orcidVerifiedName} (ORCID registry)` : "Auto-filled from ORCID registry"
          }}</span>
          <span v-else-if="orcidStatus === 'not-found'" class="orcid-status orcid-not-found"
            >ORCID not found in registry</span
          >
          <span v-else-if="orcidStatus === 'invalid'" class="orcid-status orcid-not-found">Invalid ORCID format</span>
        </div>
        <div class="form-group">
          <label for="email">Email (optional)</label>
          <input id="email" v-model="form.email" type="email" placeholder="name@example.com" />
        </div>
        <div class="form-group">
          <label>Start date (optional)</label>
          <div class="date-with-clear">
            <DatePicker name="start-date" v-model="form.startDate" :end="today" @error="startDateError = $event" />
            <BaseButton
              v-if="form.startDate || (startDateError && !startDateError.isValidDateString)"
              type="secondary"
              size="small"
              @click="clearStartDate"
              >Clear</BaseButton
            >
          </div>
          <span v-if="startDateError && !startDateError.isValidDateString" class="date-error"
            >Invalid date. Use format <i>YYYY-MM-DD</i>.</span
          >
          <span v-else-if="startDateError && !startDateError.isNotInFuture" class="date-error"
            >Date cannot be in the future.</span
          >
        </div>
        <div class="form-group">
          <label>End date (optional)</label>
          <div class="date-with-clear">
            <DatePicker name="end-date" v-model="form.endDate" :end="today" @error="endDateError = $event" />
            <BaseButton
              v-if="form.endDate || (endDateError && !endDateError.isValidDateString)"
              type="secondary"
              size="small"
              @click="clearEndDate"
              >Clear</BaseButton
            >
          </div>
          <span v-if="endDateError && !endDateError.isValidDateString" class="date-error"
            >Invalid date. Use format <i>YYYY-MM-DD</i>.</span
          >
          <span v-else-if="endDateError && !endDateError.isNotInFuture" class="date-error"
            >Date cannot be in the future.</span
          >
        </div>
        <div v-if="formError" class="form-error">{{ formError }}</div>
      </template>
      <template #footer>
        <BaseButton
          type="primary"
          html-type="submit"
          :disabled="
            submitting || orcidStatus === 'loading' || orcidStatus === 'not-found' || orcidStatus === 'invalid'
          "
          >{{ submitting ? "Saving…" : "Save" }}</BaseButton
        >
        <BaseButton v-if="personIsAutoFilled && !editingContactId" type="secondary" @click="clearSelectedPerson"
          >Clear</BaseButton
        >
        <BaseButton type="secondary" @click="closeModal">Cancel</BaseButton>
      </template>
    </BaseModal>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import { hasPermission } from "@/lib/auth";
import type { Contact } from "@shared/entity/Contact";
import type { PermissionType } from "@shared/entity/Permission";
import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";
import DatePicker, { type DateErrors } from "@/components/DatePicker.vue";
import PersonAutocomplete, { type PersonSuggestion } from "@/components/PersonAutocomplete.vue";
import { normalizeOrcid } from "@shared/entity/Person";

const props = defineProps<{
  apiPath: string;
  permissionKey: PermissionType;
  emptyMessage: string;
}>();

const state = ref<"loading" | "ready" | "error">("loading");
const contacts = ref<Contact[]>([]);
const showModal = ref(false);
const editingContactId = ref<number | null>(null);
const editingOrcidLocked = ref(false);
const formError = ref<string | null>(null);
const submitting = ref(false);
const today = new Date().toISOString().slice(0, 10);

const form = ref({
  firstName: "",
  lastName: "",
  orcid: "",
  email: "",
  startDate: null as string | null,
  endDate: null as string | null,
});

const canManage = computed(() => hasPermission(props.permissionKey).value);

const startDateError = ref<DateErrors | null>(null);
const endDateError = ref<DateErrors | null>(null);

const personAutocomplete = ref<InstanceType<typeof PersonAutocomplete> | null>(null);
const selectedPersonId = ref<number | null>(null);

function onPersonSelected(person: PersonSuggestion) {
  selectedPersonId.value = person.id;
  form.value.firstName = person.firstName;
  form.value.lastName = person.lastName;
  form.value.orcid = person.orcid ?? "";
  form.value.email = person.email ?? "";
}

const personIsAutoFilled = computed(
  () => !!selectedPersonId.value || orcidStatus.value === "found-db" || orcidStatus.value === "found-orcid",
);
const nameIsLocked = computed(() => personIsAutoFilled.value);

function clearSelectedPerson() {
  selectedPersonId.value = null;
  form.value = {
    firstName: "",
    lastName: "",
    orcid: "",
    email: "",
    startDate: form.value.startDate,
    endDate: form.value.endDate,
  };
  orcidStatus.value = "idle";
  personAutocomplete.value?.reset();
}

const orcidStatus = ref<"idle" | "loading" | "found-orcid" | "found-db" | "not-found" | "invalid">("idle");
const orcidVerifiedName = ref("");
let orcidLookupTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => form.value.orcid,
  (raw) => {
    if (orcidLookupTimer) clearTimeout(orcidLookupTimer);
    if (selectedPersonId.value) return;
    orcidStatus.value = "idle";
    if (!raw.trim()) return;
    const normalized = normalizeOrcid(raw);
    if (!normalized) {
      orcidStatus.value = "invalid";
      return;
    }
    orcidStatus.value = "loading";
    orcidLookupTimer = setTimeout(() => lookupOrcid(normalized), 500);
  },
);

function isStale(orcid: string): boolean {
  return normalizeOrcid(form.value.orcid) !== orcid;
}

async function lookupOrcid(orcid: string) {
  const isEditing = !!editingContactId.value;
  if (!isEditing) {
    try {
      const dbRes = await axios.get(`${backendUrl}persons/orcid/${orcid}`);
      if (isStale(orcid)) return;
      if (dbRes.data) {
        form.value.firstName = dbRes.data.firstName;
        form.value.lastName = dbRes.data.lastName;
        if (dbRes.data.email) form.value.email = dbRes.data.email;
        orcidVerifiedName.value = `${dbRes.data.firstName} ${dbRes.data.lastName}`;
        orcidStatus.value = "found-db";
        return;
      }
    } catch (err) {
      console.warn("DB person lookup failed:", err);
    }
  }
  try {
    const res = await axios.get(`https://pub.orcid.org/v3.0/${orcid}/person`, {
      headers: { Accept: "application/json" },
    });
    if (isStale(orcid)) return;
    const name = res.data?.name;
    const firstName: string = name?.["given-names"]?.value ?? "";
    const lastName: string = name?.["family-name"]?.value ?? "";
    if (firstName || lastName) {
      if (!isEditing) {
        form.value.firstName = firstName;
        form.value.lastName = lastName;
        form.value.email = "";
      }
      orcidVerifiedName.value = `${firstName} ${lastName}`.trim();
      orcidStatus.value = "found-orcid";
    } else {
      orcidStatus.value = "not-found";
    }
  } catch {
    if (isStale(orcid)) return;
    orcidStatus.value = "not-found";
  }
}

onMounted(async () => {
  await fetchContacts();
});

onBeforeUnmount(() => {
  if (orcidLookupTimer) clearTimeout(orcidLookupTimer);
});

async function fetchContacts() {
  state.value = "loading";
  try {
    const res = await axios.get<Contact[]>(`${backendUrl}${props.apiPath}/contacts`);
    contacts.value = res.data;
    state.value = "ready";
  } catch {
    state.value = "error";
  }
}

function clearStartDate() {
  form.value.startDate = null;
  startDateError.value = null;
}

function clearEndDate() {
  form.value.endDate = null;
  endDateError.value = null;
}

function openAddModal() {
  editingContactId.value = null;
  form.value = { firstName: "", lastName: "", orcid: "", email: "", startDate: null, endDate: null };
  formError.value = null;
  startDateError.value = null;
  endDateError.value = null;
  orcidStatus.value = "idle";
  selectedPersonId.value = null;
  personAutocomplete.value?.reset();
  showModal.value = true;
}

function openEditModal(contact: Contact) {
  editingContactId.value = contact.id;
  form.value = {
    firstName: contact.person.firstName,
    lastName: contact.person.lastName,
    orcid: contact.person.orcid ?? "",
    email: contact.person.email ?? "",
    startDate: contact.startDate ?? null,
    endDate: contact.endDate ?? null,
  };
  editingOrcidLocked.value = !!contact.person.orcid;
  formError.value = null;
  startDateError.value = null;
  endDateError.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function submitContact() {
  if (submitting.value) return;
  submitting.value = true;
  formError.value = null;
  try {
    if (editingContactId.value) {
      const payload: Record<string, any> = {
        startDate: form.value.startDate || null,
        endDate: form.value.endDate || null,
        email: form.value.email || null,
      };
      if (!editingOrcidLocked.value) {
        const orcid = normalizeOrcid(form.value.orcid);
        if (orcid) payload.orcid = orcid;
      }
      await axios.put(`${backendUrl}${props.apiPath}/contacts/${editingContactId.value}`, payload);
    } else {
      const payload = selectedPersonId.value
        ? {
            personId: selectedPersonId.value,
            email: form.value.email || null,
            startDate: form.value.startDate || null,
            endDate: form.value.endDate || null,
          }
        : {
            firstName: form.value.firstName,
            lastName: form.value.lastName,
            orcid: normalizeOrcid(form.value.orcid) || undefined,
            email: form.value.email || null,
            startDate: form.value.startDate || null,
            endDate: form.value.endDate || null,
          };
      await axios.post(`${backendUrl}${props.apiPath}/contacts`, payload);
    }
    showModal.value = false;
    await fetchContacts();
  } catch (err: any) {
    const errors = err.response?.data?.errors;
    formError.value = Array.isArray(errors) ? errors.join(". ") : errors ?? "Failed to save contact.";
  } finally {
    submitting.value = false;
  }
}

const showDeleteModal = ref(false);
const deletingContactId = ref<number | null>(null);
const deleteError = ref<string | null>(null);
const deleting = ref(false);

function deleteContact(id: number) {
  deletingContactId.value = id;
  deleteError.value = null;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!deletingContactId.value || deleting.value) return;
  deleting.value = true;
  try {
    await axios.delete(`${backendUrl}${props.apiPath}/contacts/${deletingContactId.value}`);
    showDeleteModal.value = false;
    deletingContactId.value = null;
    await fetchContacts();
  } catch {
    deleteError.value = "Failed to delete contact.";
  } finally {
    deleting.value = false;
  }
}

function cancelDelete() {
  showDeleteModal.value = false;
  deletingContactId.value = null;
  deleteError.value = null;
}
</script>

<style scoped>
.description {
  color: #444;
}

.description-spaced {
  margin-bottom: 1.5rem;
}

.contacts-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.contacts-table {
  width: 100%;
  border-collapse: collapse;
}

.contacts-table th,
.contacts-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.contacts-table th {
  font-weight: 600;
  background: #f5f5f5;
}

.nowrap {
  white-space: nowrap;
}

.actions {
  display: inline-flex;
  gap: 0.5rem;
}

.actions :deep(.button.small) {
  padding: 0.25rem 0.75rem;
}

.no-data {
  color: gray;
  margin-top: 2rem;
}

.load-error {
  color: #c00;
  margin-top: 1rem;
}

.date-with-clear {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 500;
}

.form-group input {
  padding: 0.4rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:disabled {
  background-color: #f0f0f0;
  color: #666;
}

.form-group input::placeholder {
  color: #999;
}

.date-error {
  color: #c00;
  font-size: 0.85rem;
}

.form-error {
  color: #c00;
  font-size: 0.9rem;
}

.orcid-status {
  font-size: 0.85rem;
  margin-top: 0.15rem;
}

.orcid-loading {
  color: #888;
}

.orcid-found {
  color: #2a7a2a;
}

.orcid-not-found {
  color: #a06000;
}
</style>
