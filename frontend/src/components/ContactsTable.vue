<template>
  <main class="pagewidth">
    <div class="contacts-header">
      <h2>Contacts</h2>
      <BaseButton v-if="canManage" type="primary" @click="openAddModal">Add contact</BaseButton>
    </div>

    <div v-if="state === 'loading'">Loading...</div>
    <div v-else-if="state === 'error'" class="error">Failed to load contacts.</div>
    <template v-else>
      <table v-if="contacts.length > 0" class="contacts-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>ORCID</th>
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

    <BaseModal :open="showModal" @submit="submitContact" @close="closeModal">
      <template #header>
        <h3>{{ editingContactId ? "Edit contact" : "Add contact" }}</h3>
      </template>
      <template #body>
        <template v-if="!editingContactId">
          <div class="form-group">
            <label for="orcid">ORCID iD (optional)</label>
            <input id="orcid" v-model="form.orcid" type="text" placeholder="0000-0000-0000-0000" />
            <span v-if="orcidStatus === 'loading'" class="orcid-status orcid-loading">Looking up…</span>
            <span v-else-if="orcidStatus === 'found'" class="orcid-status orcid-found"
              >Name auto-filled from ORCID</span
            >
            <span v-else-if="orcidStatus === 'not-found'" class="orcid-status orcid-not-found"
              >ORCID not found in registry</span
            >
          </div>
          <div class="form-group">
            <label for="first-name">First name</label>
            <input id="first-name" v-model="form.firstName" type="text" required />
          </div>
          <div class="form-group">
            <label for="last-name">Last name</label>
            <input id="last-name" v-model="form.lastName" type="text" required />
          </div>
        </template>
        <div class="form-group">
          <label for="start-date">Start date (optional)</label>
          <input id="start-date" v-model="form.startDate" type="date" />
        </div>
        <div class="form-group">
          <label for="end-date">End date (optional)</label>
          <input id="end-date" v-model="form.endDate" type="date" />
        </div>
        <div v-if="formError" class="form-error">{{ formError }}</div>
      </template>
      <template #footer>
        <BaseButton type="primary" html-type="submit">Save</BaseButton>
        <BaseButton type="secondary" @click="closeModal">Cancel</BaseButton>
      </template>
    </BaseModal>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import { hasPermission } from "@/lib/auth";
import type { Contact } from "@shared/entity/Contact";
import type { PermissionType } from "@shared/entity/Permission";
import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";

const props = defineProps<{
  apiPath: string;
  permissionKey: PermissionType;
  emptyMessage: string;
}>();

const state = ref<"loading" | "ready" | "error">("loading");
const contacts = ref<Contact[]>([]);
const showModal = ref(false);
const editingContactId = ref<number | null>(null);
const formError = ref<string | null>(null);

const form = ref({
  firstName: "",
  lastName: "",
  orcid: "",
  startDate: "",
  endDate: "",
});

const canManage = computed(() => hasPermission(props.permissionKey).value);

const orcidStatus = ref<"idle" | "loading" | "found" | "not-found">("idle");
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
let orcidLookupTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => form.value.orcid,
  (orcid) => {
    if (orcidLookupTimer) clearTimeout(orcidLookupTimer);
    orcidStatus.value = "idle";
    const normalized = orcid.trim();
    if (!ORCID_RE.test(normalized)) return;
    orcidStatus.value = "loading";
    orcidLookupTimer = setTimeout(() => lookupOrcid(normalized), 500);
  },
);

async function lookupOrcid(orcid: string) {
  try {
    const res = await axios.get(`https://pub.orcid.org/v3.0/${orcid}/person`, {
      headers: { Accept: "application/json" },
    });
    if (form.value.orcid.trim() !== orcid) return;
    const name = res.data?.name;
    const firstName: string = name?.["given-names"]?.value ?? "";
    const lastName: string = name?.["family-name"]?.value ?? "";
    if (firstName || lastName) {
      form.value.firstName = firstName;
      form.value.lastName = lastName;
      orcidStatus.value = "found";
    } else {
      orcidStatus.value = "not-found";
    }
  } catch {
    if (form.value.orcid.trim() !== orcid) return;
    orcidStatus.value = "not-found";
  }
}

onMounted(async () => {
  await fetchContacts();
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

function openAddModal() {
  editingContactId.value = null;
  form.value = { firstName: "", lastName: "", orcid: "", startDate: "", endDate: "" };
  formError.value = null;
  orcidStatus.value = "idle";
  showModal.value = true;
}

function openEditModal(contact: Contact) {
  editingContactId.value = contact.id;
  form.value = {
    firstName: contact.person.firstName,
    lastName: contact.person.lastName,
    orcid: contact.person.orcid ?? "",
    startDate: contact.startDate ?? "",
    endDate: contact.endDate ?? "",
  };
  formError.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function submitContact() {
  formError.value = null;
  try {
    if (editingContactId.value) {
      const payload = {
        startDate: form.value.startDate || null,
        endDate: form.value.endDate || null,
      };
      await axios.put(`${backendUrl}${props.apiPath}/contacts/${editingContactId.value}`, payload);
    } else {
      const payload = {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        orcid: form.value.orcid || undefined,
        startDate: form.value.startDate || null,
        endDate: form.value.endDate || null,
      };
      await axios.post(`${backendUrl}${props.apiPath}/contacts`, payload);
    }
    showModal.value = false;
    await fetchContacts();
  } catch (err: any) {
    formError.value = err.response?.data?.errors ?? "Failed to save contact.";
  }
}

async function deleteContact(id: number) {
  if (!confirm("Delete this contact?")) return;
  try {
    await axios.delete(`${backendUrl}${props.apiPath}/contacts/${id}`);
    await fetchContacts();
  } catch {
    alert("Failed to delete contact.");
  }
}
</script>

<style scoped>
.contacts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  color: #666;
  font-style: italic;
  margin-top: 1rem;
}

.error {
  color: #c00;
  margin-top: 1rem;
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
