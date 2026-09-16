<template>
  <main class="pagewidth">
    <div class="new-layout">
      <section class="description">
        <div v-if="parsedDescription?.intro" v-html="parsedDescription.intro"></div>
        <div v-else class="detailslistNotAvailable">Site description is missing.</div>
        <div v-if="canEdit" class="description-actions">
          <BaseButton @click="startEditing" type="primary" size="small">
            {{ site.description ? "Edit" : "Add" }}
          </BaseButton>
        </div>
        <h2>Instruments</h2>
        <BaseSpinner v-if="instrumentsStatus === 'loading'" />
        <div v-else-if="instrumentsStatus === 'error'" class="detailslistError">
          Failed to load instrument information.
        </div>
        <div v-else-if="activeInstruments && activeInstruments.length" class="detailslist">
          <div>
            The following instruments have done measurements at the site in the last {{ instrumentsFromLastDays }} days:
          </div>
          <div v-for="(instrument, index) in activeInstruments" :key="index" class="detailslistItem">
            <img alt="instrument icon" :src="instrument.icon" class="product" />
            <span v-if="instrument.to">
              <router-link :to="instrument.to">{{ instrument.name }}</router-link>
            </span>
            <span v-else>{{ instrument.name }}</span>
            <router-link
              v-if="nominalUuids.has(instrument.uuid)"
              :to="{ name: 'SiteNominalInstruments' }"
              class="nominal-link"
              title="Nominal instrument for one or more products"
            >
              <BaseTag type="actris" size="small">Nominal</BaseTag>
            </router-link>
          </div>
        </div>
        <div v-else-if="inactiveInstruments && inactiveInstruments.length" class="detailslist">
          <div>No recent data but the following instruments have done measurements at the site:</div>
          <div v-for="(instrument, index) in inactiveInstruments" :key="index" class="detailslistItem">
            <img alt="instrument icon" :src="instrument.icon" class="product" />
            <span v-if="instrument.to">
              <router-link :to="instrument.to">{{ instrument.name }}</router-link>
            </span>
            <span v-else>{{ instrument.name }}</span>
            <router-link
              v-if="nominalUuids.has(instrument.uuid)"
              :to="{ name: 'SiteNominalInstruments' }"
              class="nominal-link"
              title="Nominal instrument for one or more products"
            >
              <BaseTag type="actris" size="small">Nominal</BaseTag>
            </router-link>
          </div>
        </div>
        <div v-else class="detailslistNotAvailable">No data received yet.</div>
        <div v-if="parsedDescription?.sections" v-html="parsedDescription.sections"></div>
        <template v-if="links.length > 0 || automaticLinks.length > 0">
          <h2>Links</h2>
          <ul class="links">
            <li v-for="(link, index) in links" :key="index" v-html="link"></li>
            <li v-for="link in automaticLinks" :key="link.href">
              <a :href="link.href" target="_blank">{{ link.text }}</a>
              {{ link.suffix }}
            </li>
          </ul>
        </template>
      </section>
      <aside>
        <section id="sitemap" v-if="site.type.includes('mobile')">
          <BaseSpinner v-if="locations.status === 'loading'" />
          <TrackMap v-else-if="locations.status === 'ready'" :site="site.id" :track="locations.value" />
          <div v-else-if="locations.status === 'notFound'" style="padding: 10px; color: gray">No location history.</div>
          <div v-else-if="locations.status === 'error'" style="padding: 10px; color: red">
            Failed to load location history.
          </div>
        </section>
        <section id="sitemap" v-else-if="site.latitude != null && site.longitude != null">
          <MyMap :sites="[site]" :center="[site.latitude, site.longitude]" :zoom="5" :fullHeight="true" :key="mapKey" />
        </section>
        <section class="details">
          <dl>
            <template v-if="site.latitude != null && site.longitude != null">
              <dt>Coordinates</dt>
              <dd>
                {{ formatCoordinates(site.latitude, site.longitude) }}
              </dd>
            </template>
            <template v-if="site.altitude != null">
              <dt>Altitude</dt>
              <dd>
                {{ site.altitude }}
                <abbr title="meters above mean sea level">m a.s.l.</abbr>
              </dd>
            </template>
            <template v-if="site.labellingStatus">
              <dt>Compliance</dt>
              <dd>{{ labellingStatusText[site.labellingStatus] }}</dd>
            </template>
            <template v-if="site.contacts.length > 0">
              <dt>Contact</dt>
              <dd>
                <ul>
                  <li v-for="contact in site.contacts" :key="contact.id">
                    {{ contact.person.firstName }} {{ contact.person.lastName }}
                    <a :href="'https://orcid.org/' + contact.person.orcid" target="_blank" v-if="contact.person.orcid">
                      <img :src="orcidLogo" width="16" height="16" alt="ORCID" />
                    </a>
                  </li>
                </ul>
              </dd>
            </template>
          </dl>
        </section>
      </aside>
    </div>
    <BaseModal :open="editing && canEdit" @submit="saveDescription">
      <template #header>
        <h3>Edit site description</h3>
      </template>
      <template #body>
        <div class="form-group">
          <div class="preview-toggle">
            <CheckBox v-model="showPreview" label="Preview" />
          </div>
          <template v-if="!showPreview">
            <textarea
              id="site-description"
              aria-label="Description"
              v-model="draftDescription"
              rows="20"
              class="modal-textarea"
              placeholder="Describe the site in Markdown..."
            ></textarea>
            <div class="help-text">
              <p>
                Any <code>##</code> sections are shown after the instrument list. Two headings have a special meaning:
              </p>
              <ul>
                <li>
                  <code>## References</code> — a list of publications. Each list item is formatted as a reference, so
                  use one item per publication, e.g.
                  <code
                    >- Author et al. (2020). Title. *Journal*, 1, 1–10. [https://doi.org/...](https://doi.org/...)</code
                  >
                </li>
                <li>
                  <code>## Links</code> — a list of links, e.g. <code>- [Site home page](https://...)</code>. These are
                  shown in the Links section at the bottom of the page, before the links added automatically from site
                  metadata.
                </li>
              </ul>
            </div>
          </template>
          <div v-else class="description preview-container">
            <div v-if="preview.intro" v-html="preview.intro"></div>
            <div v-else class="detailslistNotAvailable">Site description is missing.</div>
            <div v-if="preview.sections" v-html="preview.sections"></div>
            <template v-if="preview.links.length > 0 || automaticLinks.length > 0">
              <h2>Links</h2>
              <ul class="links">
                <li v-for="(link, index) in preview.links" :key="index" v-html="link"></li>
                <li
                  v-for="link in automaticLinks"
                  :key="link.href"
                  class="automatic-link"
                  title="Added automatically from site metadata"
                >
                  <a :href="link.href" target="_blank">{{ link.text }}</a>
                  {{ link.suffix }}
                </li>
              </ul>
            </template>
          </div>
        </div>
        <div v-if="saveError" class="save-error">{{ saveError }}</div>
      </template>
      <template #footer>
        <BaseButton @click="cancelEditing" type="secondary" :disabled="saving">Cancel</BaseButton>
        <BaseButton type="primary" htmlType="submit" :disabled="saving">{{ saving ? "Saving…" : "Save" }}</BaseButton>
      </template>
    </BaseModal>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import type { Site, LabellingStatus } from "@shared/entity/Site";
import type { NominalInstrument } from "@shared/entity/Instrument";
import MyMap from "@/components/SuperMap.vue";
import { formatCoordinates, getInstrumentIcon, backendUrl } from "@/lib";
import type { ReducedMetadataResponse } from "@shared/entity/ReducedMetadataResponse";
import TrackMap, { type Point } from "@/components/TrackMap.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";
import type { RouteLocationRaw } from "vue-router";
import orcidLogo from "@/assets/icons/orcid.png";
import BaseTag from "@/components/BaseTag.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";
import CheckBox from "@/components/CheckBox.vue";
import { hasPermission } from "@/lib/auth";
import { parseSiteDescription } from "@/lib/siteDescription";

interface Instrument {
  to: RouteLocationRaw | null;
  name: string;
  icon: string;
  uuid: string;
}

type LocationsResult =
  | { status: "loading" }
  | { status: "ready"; value: Point[] }
  | { status: "notFound" }
  | { status: "error"; error: Error };

export interface Props {
  site: Site;
}

const props = defineProps<Props>();
const emit = defineEmits<(e: "update:site", site: Site) => void>();

const labellingStatusText: Record<LabellingStatus, string> = {
  "planned": "ACTRIS labelling planned",
  "initially-accepted": "Initially accepted for ACTRIS labelling",
  "labelled": "ACTRIS labelled",
};

const activeInstruments = ref<Instrument[]>([]);
const inactiveInstruments = ref<Instrument[]>([]);
const nominalUuids = ref(new Set());
const instrumentsFromLastDays = 30;
const instrumentsStatus = ref<"loading" | "error" | "ready">("loading");
const mapKey = ref(0);
const locations = ref<LocationsResult>({ status: "loading" });

const parsedDescription = computed(() =>
  props.site.description ? parseSiteDescription(props.site.description) : null,
);
const links = computed(() => parsedDescription.value?.links ?? []);

const automaticLinks = computed(() => {
  const result: { href: string; text: string; suffix: string }[] = [];
  if (props.site.dvasId) {
    result.push({
      href: `https://data.actris.eu/facility/${props.site.dvasId}`,
      text: props.site.dvasName || props.site.dvasId,
      suffix: "in ACTRIS data portal",
    });
  }
  if (props.site.actrisId) {
    result.push({
      href: `https://nflabelling.actris.eu/facility/${props.site.actrisId}`,
      text: String(props.site.actrisName || props.site.actrisId),
      suffix: "in ACTRIS labelling database",
    });
  }
  if (props.site.wigosId) {
    result.push({
      href: `https://oscar.wmo.int/surface/#/search/station/stationReportDetails/${props.site.wigosId}`,
      text: props.site.wigosName || props.site.wigosId,
      suffix: "in WMO Integrated Global Observing System (WIGOS)",
    });
  }
  return result;
});

const canEdit = hasPermission("canManageSiteDescriptions");
const editing = ref(false);
const draftDescription = ref("");
const showPreview = ref(false);
const preview = computed(() => parseSiteDescription(draftDescription.value));
const saving = ref(false);
const saveError = ref<string | null>(null);

function startEditing() {
  draftDescription.value = props.site.description || "";
  showPreview.value = false;
  saveError.value = null;
  editing.value = true;
}

function cancelEditing() {
  editing.value = false;
}

async function saveDescription() {
  saving.value = true;
  saveError.value = null;
  try {
    const res = await axios.put<{ description: string | null }>(`${backendUrl}sites/${props.site.id}/description`, {
      description: draftDescription.value,
    });
    emit("update:site", { ...props.site, description: res.data.description });
    editing.value = false;
  } catch (err: any) {
    const errors = err.response?.data?.errors;
    saveError.value = Array.isArray(errors) ? errors.join(". ") : errors ?? "Failed to save description.";
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (props.site.type.includes("mobile")) {
    axios
      .get(`${backendUrl}sites/${props.site.id}/locations`)
      .then((res) => {
        if (res.data.length > 0) {
          locations.value = { status: "ready", value: res.data };
        } else {
          locations.value = { status: "notFound" };
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          locations.value = { status: "notFound" };
        } else {
          locations.value = { status: "error", error };
          console.error("Failed to load locations", error);
        }
      });
  } else {
    locations.value = { status: "notFound" };
  }
  Promise.all([loadInstruments(), loadNominalInstruments()])
    .then(([[inactiveInst, activeInst], nominal]) => {
      inactiveInstruments.value = inactiveInst;
      activeInstruments.value = activeInst;
      nominalUuids.value = nominal;
      instrumentsStatus.value = "ready";
    })
    .catch((error) => {
      console.error(error);
      instrumentsStatus.value = "error";
    });
});

function handleInstrument(response: ReducedMetadataResponse): Instrument {
  return {
    to: { name: "Instrument", params: { uuid: response.instrument.uuid } },
    name: `${response.instrument.name} ${response.instrument.type}`,
    icon: getInstrumentIcon(response.instrument.instrument),
    uuid: response.instrument.uuid,
  };
}

async function loadInstruments() {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - instrumentsFromLastDays);
  const isActive = (md: ReducedMetadataResponse) => md.measurementDate >= dateFrom.toISOString().slice(0, 10);
  const res = await axios.get<ReducedMetadataResponse[]>(`${backendUrl}uploaded-metadata/`, {
    params: { site: props.site.id },
  });
  return [
    res.data.filter((md) => !isActive(md)).map(handleInstrument),
    res.data.filter(isActive).map(handleInstrument),
  ];
}

async function loadNominalInstruments() {
  const now = new Date();
  const res = await axios.get<NominalInstrument[]>(`${backendUrl}nominal-instrument/`, {
    params: {
      site: props.site.id,
      date: now,
    },
  });
  return new Set(res.data.flatMap((item) => item.nominalInstrument.uuid));
}
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

img.product {
  height: auto;
  width: 1em;
  margin-right: 0.3em;
}

.detailslist {
  .detailslistItem {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    margin-left: 10px;

    .tag {
      margin-left: 0.25rem;
    }

    .nominal-link {
      text-decoration: none;
    }
  }
}

.detailslistNotAvailable {
  color: gray;
}

.forcewrap {
  flex-basis: 100%;
  height: 0;
}

#sitelanding .graph {
  flex-grow: 1;
  flex-basis: 0;
}

#sitemap {
  height: 300px;
}

#sitemap .details {
  padding: 0;
}

.viz-options {
  display: flex;
  padding-top: 1rem;
}

.viz-option + .viz-option {
  margin-left: 1rem;
}

#reset {
  cursor: pointer;
  text-decoration: underline;
  color: #bcd2e2;
  margin-bottom: 2rem;
  margin-top: 20px;
  display: block;
  width: 100px;
}

#instruments {
  max-width: 650px;
}

.new-layout {
  display: flex;
  gap: 2rem;
}

aside {
  width: 300px;
  flex-shrink: 0;
}

.description {
  hyphens: auto;
  text-align: justify;
  flex-grow: 1;
}

.description:deep(p + p) {
  margin-top: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.preview-toggle {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}

:deep(.modal-container) {
  width: min(56rem, calc(100vw - 2rem));
}

.modal-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 300px;
}

.preview-container {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.links {
  list-style: disc;
  padding-left: 1rem;
  margin-bottom: 2rem;
}

.automatic-link {
  color: #888;

  a {
    color: #888;
  }
}

.help-text {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #555;
  text-align: left;
  hyphens: none;

  p + p,
  ul {
    margin-top: 0.5rem;
  }

  ul {
    list-style: disc;
    padding-left: 1.25rem;
  }

  li + li {
    margin-top: 0.25rem;
  }

  code {
    font-family: monospace;
    font-size: 0.85rem;
    background: #f3f3f3;
    padding: 0 0.25rem;
    border-radius: 3px;
  }
}

.save-error {
  color: #e74c3c;
  margin-top: 0.5rem;
}

.description:deep(ul) {
  list-style: disc;
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

:deep() {
  h2 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-size: 125%;
  }

  ul.references,
  ol.references {
    margin-left: 2rem;
    text-indent: -2rem;
    padding: 0;
    list-style: none;

    li + li {
      margin-top: 0.5rem;
    }

    em {
      font-style: italic;
    }
  }

  ol.references {
    list-style: decimal inside;
  }
}

dt {
  font-weight: 500;
  margin-top: 0.25rem;
}

:deep(.pagewidth) {
  max-width: 1000px;
}

@media screen and (max-width: variables.$narrow-screen) {
  .new-layout {
    display: block;
  }
}
</style>
