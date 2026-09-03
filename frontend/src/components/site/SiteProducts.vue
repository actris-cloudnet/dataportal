<template>
  <div class="pagewidth">
    <section id="product_availability" class="graph" v-if="!selectedProduct">
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
        <template v-if="selectedProduct">
          / availability &ndash;
          <router-link
            v-if="currentInstrument"
            :to="{ name: 'Instrument', params: { uuid: currentInstrument.uuid } }"
            class="instrument-link"
          >
            {{ currentInstrument.name }}
          </router-link>
          <router-link
            v-else-if="currentModel"
            :to="{ name: 'Model', params: { modelId: currentModel.id } }"
            class="instrument-link"
          >
            {{ currentModel.humanReadableName }}
          </router-link>
          <span v-else>
            {{ selectedProduct.humanReadableName }}
          </span>
        </template>
      </h2>

      <section class="details" v-if="selectedProductId">
        <ProductAvailabilityVisualizationSingle
          v-if="dataStatus"
          :dataStatus="dataStatus"
          :productId="selectedProductId"
          :year="selectedYear"
          :instrumentPid="selectedInstPid"
          :modelId="selectedModelId"
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
        <div class="viz-option" style="width: 370px" v-if="!isSingleProductSite">
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
          <custom-multiselect v-model="selectedYear" label="Year" :options="yearOptions" id="yearSelect" clearable />
        </div>
        <div class="viz-option" style="width: 300px" v-if="pidOptions.length > 1">
          <custom-multiselect
            v-model="selectedInstPid"
            label="Instrument"
            :options="pidOptions"
            id="pidSelect"
            clearable
          />
        </div>
        <div class="viz-option" style="width: 320px" v-if="modelOptions.length > 1">
          <custom-multiselect
            v-model="selectedModelId"
            label="Model"
            :options="modelOptions"
            id="modelSelect"
            clearable
          />
        </div>
      </div>
      <a @click="reset" id="reset" v-if="!isSingleProductSite">Reset filter</a>
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
import { queryInteger, queryString, useRouteQuery } from "@/lib/useRouteQuery";

export interface Props {
  site: Site;
}

const props = defineProps<Props>();

const dataStatus = ref<DataStatus | null>(null);

const selectedProductId = useRouteQuery({ name: "product", type: queryString, defaultValue: null });
const selectedYear = useRouteQuery({ name: "year", type: queryInteger, defaultValue: null });
const selectedInstPid = useRouteQuery({ name: "instrumentPid", type: queryString, defaultValue: null });
const selectedModelId = useRouteQuery({ name: "model", type: queryString, defaultValue: null });

const yearOptions = computed(() => {
  if (!dataStatus.value) return [];
  return dataStatus.value.years.map((year) => ({ id: year, humanReadableName: year.toString() }));
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
  return dataStatus.value.allModels
    .filter((model) => !model.humanReadableName.includes("deprecated"))
    .map((model) => ({
      id: model.id,
      humanReadableName: model.humanReadableName,
    }));
});

const currentInstrument = computed(() => {
  if (!dataStatus.value || !selectedProductId.value || !dataStatus.value.allPids[selectedProductId.value]) {
    return null;
  }
  const pid = !selectedInstPid.value && pidOptions.value.length === 1 ? pidOptions.value[0].id : selectedInstPid.value;
  if (!pid) {
    return null;
  }
  return dataStatus.value.allPids[selectedProductId.value].find((inst) => inst.pid === pid);
});

const currentModel = computed(() => {
  if (!selectedModelId.value && modelOptions.value.length === 1) {
    return modelOptions.value[0];
  }
  return modelOptions.value.find((model) => model.id === selectedModelId.value);
});

const isSingleProductSite = computed(() => dataStatus.value?.availableProducts.length === 1);

onMounted(() => {
  parseDataStatus({ site: props.site.id })
    .then((data) => {
      dataStatus.value = data;
      if (data.availableProducts.length === 1 && !selectedProductId.value) {
        selectedProductId.value = data.availableProducts[0].id;
      }
    })
    .catch((error) => {
      console.error(error);
    });
});

const selectedProduct = computed(() => {
  if (!selectedProductId.value || !dataStatus.value || !dataStatus.value.availableProducts) return;
  return dataStatus.value.availableProducts.find((product) => product.id === selectedProductId.value);
});

function reset() {
  if (!isSingleProductSite.value) {
    selectedProductId.value = null;
  }
  selectedYear.value = null;
  selectedInstPid.value = null;
  selectedModelId.value = null;
}

watch(selectedProductId, () => {
  selectedInstPid.value = null;
  selectedModelId.value = null;
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
