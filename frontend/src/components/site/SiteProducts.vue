<template>
  <div class="pagewidth">
    <section id="product_availability" class="graph" v-if="!selectedProductName">
      <h2>Product availability</h2>
      <section class="details">
        <ProductAvailabilityVisualization
          v-if="dataStatus && dataStatus.dates.length > 0"
          :dataStatus="dataStatus"
          :siteId="site.type.includes('hidden') ? '' : site.id"
          :year="selectedYear"
        />
        <div v-else-if="dataStatus && dataStatus.dates.length == 0" class="placeholder">No products yet.</div>
        <BaseSpinner v-else />
      </section>
    </section>

    <section id="product_quality" class="graph" v-if="dataStatus && dataStatus.dates.length > 0">
      <h2>
        Product quality
        <template v-if="selectedProductName">
          / availability &ndash;
          <router-link
            v-if="currentInstrument"
            :to="{ name: 'Instrument', params: { uuid: currentInstrument.uuid } }"
            class="instrument-link"
          >
            {{ currentInstrument.name }}
            <svg fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="60px" height="60px">
              <path
                d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"
              />
            </svg>
          </router-link>
          <span v-else>
            {{ modelName || selectedProductName }}
          </span>
        </template>
      </h2>

      <section class="details" v-if="selectedProductId">
        <ProductAvailabilityVisualizationSingle
          v-if="dataStatus"
          :dataStatus="dataStatus"
          :productId="selectedProductId"
          :year="selectedYear"
          :instrumentPid="selectedPid"
          :modelId="selectedModel"
        />
        <BaseSpinner v-else />
      </section>

      <section class="details" v-else>
        <ProductQualityVisualization
          v-if="dataStatus"
          :dataStatus="dataStatus"
          :siteId="site.type.includes('hidden') ? '' : site.id"
          :year="selectedYear"
        />
        <BaseSpinner v-else />
      </section>
    </section>

    <div v-if="dataStatus && dataStatus.dates.length > 0">
      <div class="viz-options">
        <div class="viz-option" style="width: 370px">
          <custom-multiselect
            v-model="selectedProductId"
            label="Product"
            :options="dataStatus.availableProducts"
            id="singleProductSelect"
            :getIcon="getProductIcon"
            clearable
          />
        </div>
        <div class="viz-option" style="width: 130px">
          <custom-multiselect
            v-model="selectedYearOption"
            label="Year"
            :options="yearOptions"
            id="yearSelect"
            clearable
          />
        </div>
        <div class="viz-option" style="width: 300px" v-if="pidOptions.length > 1">
          <custom-multiselect
            v-model="selectedPidOption"
            label="Instrument"
            :options="pidOptions"
            id="pidSelect"
            clearable
          />
        </div>
        <div class="viz-option" style="width: 320px" v-if="modelOptions.length > 1">
          <custom-multiselect
            v-model="selectedModelOption"
            label="Model"
            :options="modelOptions"
            id="modelSelect"
            clearable
          />
        </div>
      </div>
      <a @click="reset" id="reset">Reset filter</a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, computed } from "vue";
import type { Site } from "@shared/entity/Site";
import ProductAvailabilityVisualization from "@/components/ProductAvailabilityVisualization.vue";
import ProductAvailabilityVisualizationSingle from "@/components/ProductAvailabilityVisualizationSingle.vue";
import ProductQualityVisualization from "@/components/ProductQualityVisualization.vue";
import { getProductIcon } from "@/lib";
import { parseDataStatus, type DataStatus } from "@/lib/DataStatusParser";
import CustomMultiselect from "@/components/MultiSelect.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";

export interface Props {
  site: Site;
}

const props = defineProps<Props>();

const selectedProductId = ref<string | null>(null);
const dataStatus = ref<DataStatus | null>(null);

const selectedYearOption = ref(null);
const selectedPidOption = ref(null);
const selectedModelOption = ref(null);
const selectedYear = computed(() => (selectedYearOption.value ? parseInt(selectedYearOption.value) : undefined));
const selectedPid = computed(() => (selectedPidOption.value ? selectedPidOption.value : undefined));
const selectedModel = computed(() => (selectedModelOption.value ? selectedModelOption.value : undefined));

const yearOptions = computed(() => {
  if (!dataStatus.value) return [];
  return dataStatus.value.years.map((year) => ({ id: year.toString(), humanReadableName: year.toString() }));
});

const pidOptions = computed(() => {
  if (!dataStatus.value || !selectedProductId.value || !dataStatus.value.allPids[selectedProductId.value]) {
    return [];
  }
  return dataStatus.value.allPids[selectedProductId.value].map((pid) => ({
    id: pid.pid,
    humanReadableName: pid.name,
  }));
});

const modelOptions = computed(() => {
  if (!dataStatus.value || selectedProductId.value !== "model") {
    return [];
  }
  return dataStatus.value.allModels.map((model) => ({
    id: model.id,
    humanReadableName: model.humanReadableName,
  }));
});

const currentInstrument = computed(() => {
  if (!dataStatus.value || !selectedProductId.value || !dataStatus.value.allPids[selectedProductId.value]) {
    return null;
  }
  const selectedPid =
    !selectedPidOption.value && pidOptions.value.length === 1 ? pidOptions.value[0].id : selectedPidOption.value;
  if (!selectedPid) {
    return null;
  }
  return dataStatus.value.allPids[selectedProductId.value].find((inst) => inst.pid === selectedPid);
});

const modelName = computed(() => {
  if (!selectedModelOption.value && modelOptions.value.length === 1) {
    return modelOptions.value[0].humanReadableName;
  }
  const selectedModel = modelOptions.value.find((model) => model.id === selectedModelOption.value);
  return selectedModel ? selectedModel.humanReadableName : null;
});

onMounted(() => {
  parseDataStatus({ site: props.site.id })
    .then((data) => {
      dataStatus.value = data;
    })
    .catch((error) => {
      console.error(error);
    });
});

const selectedProductName = computed(() => {
  if (!selectedProductId.value || !dataStatus.value || !dataStatus.value.availableProducts) {
    return null;
  }
  const product = dataStatus.value.availableProducts.find((product) => product.id === selectedProductId.value);
  if (!product) return null;
  return product.humanReadableName;
});

function reset() {
  selectedProductId.value = null;
  selectedYearOption.value = null;
  selectedPidOption.value = null;
  selectedModelOption.value = null;
}

watch(selectedProductId, () => {
  selectedPidOption.value = null;
  selectedModelOption.value = null;
});
</script>

<style scoped lang="scss">
.viz-options {
  display: flex;
  padding-top: 1rem;
}

.viz-option + .viz-option {
  margin-left: 1rem;
}

h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-size: 125%;
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

.placeholder {
  color: gray;
}

.instrument-link {
  color: inherit;

  svg {
    width: 1rem;
    height: auto;
  }
}
</style>
