<template>
  <div class="pagewidth">
    <section id="product_availability" class="graph" v-if="!selectedProductName">
      <h2>Product availability</h2>
      <section class="details">
        <ProductAvailabilityVisualization
          v-if="dataStatus"
          :dataStatus="dataStatus"
          :siteId="site.type.includes('hidden' as SiteType) ? '' : site.id"
          :year="selectedYear"
        />
        <BaseSpinner v-else />
      </section>
    </section>

    <section id="product_quality" class="graph">
      <h2>
        Product quality
        <template v-if="selectedProductName">/ availability - {{ selectedProductName }} </template>
        <template v-if="instrumentName"> ({{ instrumentName }})</template>
      </h2>

      <section class="details" v-if="selectedProductId">
        <ProductAvailabilityVisualizationSingle
          v-if="dataStatus"
          :dataStatus="dataStatus"
          :productId="selectedProductId"
          :year="selectedYear"
          :instrumentPid="selectedPid"
        />
        <BaseSpinner v-else />
      </section>

      <section class="details" v-else>
        <ProductQualityVisualization
          v-if="dataStatus"
          :dataStatus="dataStatus"
          :siteId="site.type.includes('hidden' as SiteType) ? '' : site.id"
          :year="selectedYear"
        />
        <BaseSpinner v-else />
      </section>
    </section>

    <div v-if="dataStatus">
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
      </div>
      <a @click="reset" id="reset">Reset filter</a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, computed } from "vue";
import type { Site, SiteType } from "@shared/entity/Site";
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
const selectedYear = computed(() => (selectedYearOption.value ? parseInt(selectedYearOption.value) : undefined));
const selectedPid = computed(() => (selectedPidOption.value ? selectedPidOption.value : undefined));

const yearOptions = computed(() => {
  if (!dataStatus.value) return [];
  return dataStatus.value.years.map((year) => ({ id: year.toString(), humanReadableName: year.toString() }));
});

const pidOptions = computed(() => {
  const { value: dataStatusValue } = dataStatus;
  const { value: selectedProductIdValue } = selectedProductId;
  if (!dataStatusValue || !selectedProductIdValue || !dataStatusValue.allPids[selectedProductIdValue]) {
    return [];
  }
  return dataStatusValue.allPids[selectedProductIdValue].map((pid) => ({
    id: pid.pid,
    humanReadableName: pid.humanReadableName,
  }));
});

const instrumentName = computed(() => {
  if (!selectedPidOption.value && pidOptions.value.length === 1) {
    return pidOptions.value[0].humanReadableName;
  }
  const selectedPid = pidOptions.value.find((pid) => pid.id === selectedPidOption.value);
  return selectedPid ? selectedPid.humanReadableName : null;
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
}

watch(selectedProductId, () => {
  selectedPidOption.value = null;
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
</style>
