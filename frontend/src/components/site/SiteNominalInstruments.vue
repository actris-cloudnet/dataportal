<template>
  <main class="pagewidth">
    <h2>Nominal instruments</h2>
    <p :class="['description', { 'description-spaced': !canManage }]">
      All instruments are processed into their own products. When several instruments of the same kind report at a site,
      the product from the nominal instrument is used as input for the
      <router-link :to="{ name: 'Product', params: { product: 'categorize' } }">categorize file</router-link>, if
      available.
    </p>
    <div v-if="canManage" class="toolbar">
      <BaseButton type="primary" @click="openAddModal()">Add nominal instrument</BaseButton>
    </div>

    <div v-if="state === 'loading'">Loading...</div>
    <div v-else-if="state === 'error'" class="load-error">Failed to load nominal instruments.</div>
    <template v-else>
      <div v-if="groups.length > 0" class="table-wrapper">
        <table class="nominal-table">
          <thead>
            <tr>
              <th>Nominal instrument</th>
              <th class="num">From</th>
              <th class="num">To</th>
              <th v-if="canManage"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in groups" :key="group.productId">
              <tr class="group">
                <td :colspan="canManage ? 4 : 3">
                  <img :src="getProductIcon(group.productId)" alt="" class="product-icon" />
                  {{ group.name }}
                </td>
              </tr>
              <tr v-for="row in group.rows" :key="row.measurementDate">
                <td>
                  <router-link
                    :to="{
                      name: 'Instrument',
                      params: { uuid: row.nominalInstrument.uuid },
                    }"
                  >
                    {{ row.nominalInstrument.name }}
                  </router-link>
                  <span v-if="row.nominalInstrument.serialNumber" class="sub">{{
                    row.nominalInstrument.serialNumber
                  }}</span>
                  <span v-if="row.isCurrent" class="pill">Current</span>
                  <span v-if="row.isScheduled" class="pill future">Scheduled</span>
                </td>
                <td class="num">{{ row.measurementDate }}</td>
                <td class="num" :class="{ muted: !row.to }">
                  {{ row.to ?? "now" }}
                </td>
                <td v-if="canManage" class="actions">
                  <BaseButton type="secondary" size="small" @click="openEditModal(row)">Edit</BaseButton>
                  <BaseButton type="danger" size="small" @click="openDeleteModal(row)">Delete</BaseButton>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div v-else class="no-data">No nominal instruments set for this site.</div>
    </template>

    <BaseModal :open="showModal" @submit="submitForm">
      <template #header>
        <h3>
          {{ editing ? "Edit nominal instrument" : "Add nominal instrument" }}
        </h3>
      </template>
      <template #body>
        <div class="form-group">
          <MultiSelect
            id="nominal-product"
            label="Product"
            v-model="form.productId"
            :options="productOptions"
            :getIcon="(option: ProductOption) => getProductIcon(option.id)"
            :disabled="!!editing"
          />
        </div>
        <div class="form-group">
          <MultiSelect
            id="nominal-instrument"
            label="Instrument"
            v-model="form.instrumentInfoUuid"
            :options="instrumentOptions"
            :getIcon="(option: InstrumentOption) => getInstrumentIcon(option.instrument)"
            :disabled="!form.productId || instrumentsState === 'loading'"
          />
          <span v-if="instrumentsState === 'error'" class="date-error">Failed to load instruments.</span>
        </div>
        <div class="form-group">
          <label>From</label>
          <DatePicker name="nominal-date" v-model="form.measurementDate" allow-future @error="dateError = $event" />
          <span v-if="dateError && !dateError.isValidDateString" class="date-error">
            Invalid date. Use format <i>YYYY-MM-DD</i>.
          </span>
        </div>
        <div v-if="formError" class="form-error">{{ formError }}</div>
      </template>
      <template #footer>
        <BaseButton type="primary" html-type="submit" :disabled="!canSubmit">
          {{ submitting ? "Saving…" : "Save" }}
        </BaseButton>
        <BaseButton type="secondary" @click="showModal = false">Cancel</BaseButton>
      </template>
    </BaseModal>

    <BaseModal :open="showDeleteModal" @submit="confirmDelete">
      <template #header>
        <h3>Delete nominal instrument</h3>
      </template>
      <template #body>
        <template v-if="deleting">
          <p>
            Remove <b>{{ deleting.nominalInstrument.name }}</b> as nominal {{ deleting.productId }} instrument from
            <b>{{ deleting.measurementDate }}</b
            >?
          </p>
        </template>
        <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
      </template>
      <template #footer>
        <BaseButton type="danger" html-type="submit" :disabled="submitting">
          {{ submitting ? "Deleting…" : "Delete" }}
        </BaseButton>
        <BaseButton type="secondary" @click="showDeleteModal = false">Cancel</BaseButton>
      </template>
    </BaseModal>
  </main>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { backendUrl, dateToString, getInstrumentIcon, getProductIcon } from "@/lib";
import { hasPermission } from "@/lib/auth";
import type { Site } from "@shared/entity/Site";
import type { Product } from "@shared/entity/Product";
import type {
  Instrument,
  InstrumentInfo,
  NominalInstrument,
  NominalInstrumentPayload,
} from "@shared/entity/Instrument";
import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";
import DatePicker, { type DateErrors } from "@/components/DatePicker.vue";
import MultiSelect from "@/components/MultiSelect.vue";

interface ProductOption {
  id: string;
  humanReadableName: string;
}

interface InstrumentOption {
  id: string;
  humanReadableName: string;
  instrument: Instrument;
}

interface Row extends NominalInstrument {
  to: string | null;
  isCurrent: boolean;
  isScheduled: boolean;
}

interface Group {
  productId: string;
  name: string;
  rows: Row[];
}

const props = defineProps<{ site: Site }>();

const state = ref<"loading" | "ready" | "error">("loading");
const entries = ref<NominalInstrument[]>([]);
const products = ref<Product[]>([]);
const today = dateToString(new Date());
const canManage = computed(() => hasPermission("canManageNominalInstruments", props.site.id).value);
const apiUrl = `${backendUrl}sites/${props.site.id}/nominal-instruments`;

const productName = (id: string) => products.value.find((p) => p.id === id)?.humanReadableName ?? id;

// Picker label details; the table shows only the serial number.
function instrumentDetails(info: InstrumentInfo): string {
  const model = info.model && info.model.toLowerCase() !== "unknown" ? info.model : null;
  return [model, info.serialNumber].filter(Boolean).join(" · ");
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return dateToString(d);
}

const groups = computed<Group[]>(() => {
  const byProduct = new Map<string, NominalInstrument[]>();
  for (const entry of entries.value) {
    const list = byProduct.get(entry.productId) ?? [];
    list.push(entry);
    byProduct.set(entry.productId, list);
  }
  const order = products.value.map((p) => p.id);
  return [...byProduct.entries()]
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([productId, list]) => {
      const sorted = [...list].sort((a, b) => b.measurementDate.localeCompare(a.measurementDate));
      const currentIndex = sorted.findIndex((row) => row.measurementDate <= today);
      return {
        productId,
        name: productName(productId),
        rows: sorted.map((row, i) => ({
          ...row,
          to: i === 0 ? null : addDays(sorted[i - 1].measurementDate, -1),
          isCurrent: i === currentIndex,
          isScheduled: row.measurementDate > today,
        })),
      };
    });
});

onMounted(async () => {
  try {
    const [productsRes] = await Promise.all([axios.get<Product[]>(`${backendUrl}products`), fetchEntries()]);
    products.value = productsRes.data;
  } catch {
    state.value = "error";
  }
});

async function fetchEntries() {
  const res = await axios.get<NominalInstrument[]>(apiUrl);
  entries.value = res.data;
  state.value = "ready";
}

async function refreshEntries() {
  try {
    await fetchEntries();
  } catch {
    state.value = "error";
  }
}

// Add / edit modal

const showModal = ref(false);
const editing = ref<NominalInstrument | null>(null);
const submitting = ref(false);
const formError = ref<string | null>(null);
const dateError = ref<DateErrors | null>(null);
const form = ref<{
  productId: string | null;
  instrumentInfoUuid: string | null;
  measurementDate: string | null;
}>({
  productId: null,
  instrumentInfoUuid: null,
  measurementDate: null,
});

const productOptions = computed<ProductOption[]>(() =>
  products.value
    .filter((p) => p.type.includes("instrument"))
    .map((p) => ({ id: p.id, humanReadableName: p.humanReadableName })),
);

const instrumentsState = ref<"idle" | "loading" | "ready" | "error">("idle");
const instrumentInfos = ref<InstrumentInfo[]>([]);

const instrumentOptions = computed<InstrumentOption[]>(() => {
  const infos = [...instrumentInfos.value];
  const current = editing.value?.nominalInstrument;
  if (current && !infos.some((info) => info.uuid === current.uuid)) infos.push(current);
  return infos.map((info) => ({
    id: info.uuid,
    humanReadableName: `${info.name} (${instrumentDetails(info) || info.instrument.humanReadableName})`,
    instrument: info.instrument,
  }));
});

let instrumentsRequest = 0;

async function fetchInstruments() {
  const request = ++instrumentsRequest;
  instrumentInfos.value = [];
  if (!form.value.productId) {
    instrumentsState.value = "idle";
    return;
  }
  instrumentsState.value = "loading";
  try {
    const params = { site: props.site.id, product: form.value.productId };
    const res = await axios.get<InstrumentInfo[]>(`${backendUrl}instrument-pids`, { params });
    if (request !== instrumentsRequest) return;
    instrumentInfos.value = res.data;
    instrumentsState.value = "ready";
  } catch {
    if (request !== instrumentsRequest) return;
    instrumentsState.value = "error";
  }
}

watch(() => form.value.productId, fetchInstruments);

const canSubmit = computed(
  () =>
    !submitting.value &&
    !!form.value.productId &&
    !!form.value.instrumentInfoUuid &&
    !!form.value.measurementDate &&
    (!dateError.value || dateError.value.isValidDateString),
);

function openAddModal() {
  editing.value = null;
  form.value = { productId: null, instrumentInfoUuid: null, measurementDate: null };
  formError.value = null;
  dateError.value = null;
  instrumentInfos.value = [];
  instrumentsState.value = "idle";
  showModal.value = true;
}

function openEditModal(row: NominalInstrument) {
  editing.value = row;
  const sameProduct = form.value.productId === row.productId;
  form.value = {
    productId: row.productId,
    instrumentInfoUuid: row.nominalInstrument.uuid,
    measurementDate: row.measurementDate,
  };
  formError.value = null;
  dateError.value = null;
  if (sameProduct) void fetchInstruments(); // watcher won't fire
  showModal.value = true;
}

async function submitForm() {
  if (!canSubmit.value) return;
  submitting.value = true;
  formError.value = null;
  try {
    if (editing.value) {
      const payload: NominalInstrumentPayload = {
        instrumentInfoUuid: form.value.instrumentInfoUuid!,
        measurementDate: form.value.measurementDate!,
      };
      await axios.put(`${apiUrl}/${editing.value.productId}/${editing.value.measurementDate}`, payload);
    } else {
      const payload: NominalInstrumentPayload = {
        productId: form.value.productId!,
        instrumentInfoUuid: form.value.instrumentInfoUuid!,
        measurementDate: form.value.measurementDate!,
      };
      await axios.post(apiUrl, payload);
    }
    showModal.value = false;
    await refreshEntries();
  } catch (err: any) {
    const errors = err.response?.data?.errors;
    formError.value = Array.isArray(errors) ? errors.join(". ") : errors ?? "Failed to save nominal instrument.";
  } finally {
    submitting.value = false;
  }
}

// Delete modal

const showDeleteModal = ref(false);
const deleting = ref<NominalInstrument | null>(null);
const deleteError = ref<string | null>(null);

function openDeleteModal(row: NominalInstrument) {
  deleting.value = row;
  deleteError.value = null;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!deleting.value || submitting.value) return;
  submitting.value = true;
  try {
    await axios.delete(`${apiUrl}/${deleting.value.productId}/${deleting.value.measurementDate}`);
    showDeleteModal.value = false;
    deleting.value = null;
    await refreshEntries();
  } catch {
    deleteError.value = "Failed to delete nominal instrument.";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-size: 125%;
}

.description {
  color: #444;
  max-width: 70ch;
}

.description-spaced {
  margin-bottom: 1.5rem;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 3rem;
}

.nominal-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    vertical-align: middle;
  }

  th {
    font-weight: 600;
    color: #555;
    border-bottom: 2px solid #c8c8c8;
  }

  .num {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  td:first-child {
    min-width: 14rem;
  }

  tr.group td {
    background: #f0f0f0;
    font-weight: 600;
    padding-top: 0.65rem;
    padding-bottom: 0.65rem;
    border-top: 1px solid #e0e0e0;
  }

  .product-icon {
    height: 1em;
    width: auto;
    vertical-align: -0.15em;
    margin-right: 0.4em;
  }

  .muted {
    color: gray;
  }

  .actions {
    white-space: nowrap;
    text-align: right;

    :deep(.button.small) {
      padding: 0.25rem 0.75rem;
      margin-left: 0.35rem;
    }
  }
}

.sub {
  color: #666;
  font-size: 0.85em;
  margin-left: 0.4em;
}

.pill {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  margin-left: 0.4rem;
  vertical-align: 1px;
  background: variables.$actris-turquoiselighterrr;
  color: variables.$actris-turquoise;

  &.future {
    background: #fff6df;
    color: #7a5300;
  }
}

.no-data {
  color: gray;
  margin-top: 2rem;
  margin-bottom: 3rem;
}

.load-error {
  color: #c00;
  margin-top: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;

  :deep(label) {
    font-weight: 500;
  }
}

.date-error,
.form-error {
  color: #c00;
  font-size: 0.85rem;
}
</style>
