<template>
  <div v-if="productInfo.status === 'ready'">
    <LandingHeader :title="productInfo.value.humanReadableName" subtitle="Cloudnet product">
      <template #tags>
        <BaseTag v-if="productInfo.value.experimental" type="experimental" title="Experimental product">
          Experimental
        </BaseTag>
      </template>
    </LandingHeader>
    <main class="pagewidth">
      <h2>Description</h2>
      <p>{{ productInfo.variables.description }}</p>
      <template v-if="productInfo.variables.references_html.length > 0">
        <h2>References</h2>
        <ul class="references">
          <li v-for="reference in productInfo.variables.references_html" :key="reference" v-html="reference"></li>
        </ul>
      </template>
      <template v-for="section in sections" :key="section">
        <h2>{{ titles[section] }}</h2>
        <p v-if="section in descriptions">
          {{ descriptions[section] }}
        </p>
        <div class="variable" v-for="variable in productInfo.variables[section]" :key="variable.name">
          <code>{{ variable.name }}</code> – {{ variable.long_name }}<br />
          <table>
            <tr v-if="variable.dimensions && variable.dimensions.length > 0">
              <th>Dimensions</th>
              <td>{{ variable.dimensions.join(", ") }}</td>
            </tr>
            <tr v-if="variable.units">
              <th>Units</th>
              <td v-html="unitsHtml(variable.units)"></td>
            </tr>
            <tr v-if="variable.dtype">
              <th>Data type</th>
              <td>{{ variable.dtype }}</td>
            </tr>
            <tr v-if="variable.standard_name">
              <th>Standard name</th>
              <td>{{ variable.standard_name }}</td>
            </tr>
            <tr v-if="variable.comment">
              <th>Description</th>
              <td>{{ variable.comment }}</td>
            </tr>
            <tr v-if="variable.definition">
              <th>Definition</th>
              <td>{{ variable.definition }}</td>
            </tr>
          </table>
        </div>
      </template>
    </main>
  </div>
  <ApiError :response="(productInfo.error as any).response" v-else-if="productInfo.status === 'error'" />
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import axios from "axios";

import type { Product } from "@shared/entity/Product";
import { backendUrl } from "@/lib";
import LandingHeader from "@/components/LandingHeader.vue";
import BaseTag from "@/components/BaseTag.vue";
import ApiError from "@/views/ApiError.vue";
import productData from "@/assets/products.json";

export interface Props {
  product: string;
}

const props = defineProps<Props>();

type ProductResult =
  | { status: "loading" }
  | { status: "ready"; value: Product; variables: any }
  | { status: "error"; error: Error };

const productInfo = ref<ProductResult>({ status: "loading" });

function unitsHtml(units: string): string {
  return units.replace(/([a-z])(-?\d+)/g, "$1<sup>$2</sup>");
}

const sections = ["dimensions", "common_variables"];

type Section = (typeof sections)[number];

const titles: Record<Section, string> = {
  dimensions: "Dimensions",
  common_variables: "Variables",
};

const descriptions: Record<Section, string> = {
  common_variables:
    "The following variables are available in all products of this type but additional variables may be present depending of the source instrument.",
};

onMounted(async () => {
  try {
    const res = await axios.get<Product>(`${backendUrl}products/${props.product}`);
    const variables = (productData as any)[props.product];
    if (variables) {
      productInfo.value = { status: "ready", value: res.data, variables };
    } else {
      const error = new Error();
      (error as any).response = { status: 404, data: "Not found" };
      productInfo.value = { status: "error", error };
    }
  } catch (error) {
    productInfo.value = { status: "error", error: error as Error };
  }
});
</script>

<style scoped lang="scss">
h2 {
  font-size: 150%;
  margin-top: 3rem;
  margin-bottom: 2rem;

  &:first-child {
    margin-top: 1rem;
  }
}

th {
  font-weight: 500;
  padding-right: 1rem;
  width: 150px;
}

.variable {
  margin-bottom: 1rem;
}

table {
  margin-top: 1rem;
  margin-left: 2rem;
  max-width: 1000px;
}

code {
  background: #eee;
  padding: 2px;
  border-radius: 4px;
  font-size: 90%;
}

p {
  margin-bottom: 2rem;
  max-width: 800px;
}

.references {
  margin-left: 2rem;
  max-width: 800px;

  li {
    text-indent: -2rem;
  }

  li + li {
    margin-top: 0.5rem;
  }
}
</style>