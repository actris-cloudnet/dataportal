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
      <p>{{ productInfo.docs.description }}</p>
      <template v-if="productInfo.value.sourceInstruments.length > 0">
        <p>Cloudnet supports the following instruments:</p>
        <ul>
          <li v-for="sourceInstrument in productInfo.value.sourceInstruments" :key="sourceInstrument.id">
            <img :src="getProductIcon(productInfo.value.id)" alt="" class="product-icon" />
            {{ sourceInstrument.humanReadableName }}
          </li>
        </ul>
      </template>
      <template v-if="productInfo.value.sourceProducts.length > 0">
        <p>The {{ getLowerCaseProductName(productInfo.value) }} product is based on these products:</p>
        <ul>
          <li v-for="sourceProduct in productInfo.value.sourceProducts" :key="sourceProduct.id">
            <router-link :to="{ name: 'Product', params: { product: sourceProduct.id } }">
              <img :src="getProductIcon(sourceProduct.id)" alt="" class="product-icon" />
              {{ sourceProduct.humanReadableName }}
            </router-link>
          </li>
        </ul>
      </template>
      <template v-if="productInfo.value.derivedProducts.length > 0">
        <p>The {{ getLowerCaseProductName(productInfo.value) }} product is used for generating these products:</p>
        <ul>
          <li v-for="derivedProduct in productInfo.value.derivedProducts" :key="derivedProduct.id">
            <router-link :to="{ name: 'Product', params: { product: derivedProduct.id } }">
              <img :src="getProductIcon(derivedProduct.id)" alt="" class="product-icon" />
              {{ derivedProduct.humanReadableName }}
            </router-link>
          </li>
        </ul>
      </template>
      <template v-if="productInfo.docs.references_html.length > 0">
        <h2>References</h2>
        <ul class="references">
          <li v-for="reference in productInfo.docs.references_html" :key="reference" v-html="reference"></li>
        </ul>
      </template>
      <template v-for="section in productInfo.variables" :key="section.id">
        <h2>{{ section.title }}</h2>
        <p v-if="section.description">{{ section.description }}</p>
        <div class="variable" v-for="variable in section.variables" :key="variable.name">
          <code>{{ variable.name }}</code> – {{ variable.long_name }}<br />
          <table>
            <tbody>
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
                <td>
                  <table class="definition">
                    <tr v-for="definition in variable.definition" :key="definition.label">
                      <th>{{ definition.label }}:</th>
                      <td>{{ definition.description }}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </main>
  </div>
  <ApiError :response="(productInfo.error as any).response" v-else-if="productInfo.status === 'error'" />
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import axios from "axios";

import type { Product } from "@shared/entity/Product";
import { backendUrl, getProductIcon, getLowerCaseProductName } from "@/lib";
import LandingHeader from "@/components/LandingHeader.vue";
import BaseTag from "@/components/BaseTag.vue";
import ApiError from "@/views/ApiError.vue";
import productData from "@/assets/products.json";
import type { Instrument } from "@shared/entity/Instrument";

export interface Props {
  product: string;
}

const props = defineProps<Props>();

interface Section {
  id: string;
  title: string;
  description?: string;
  variables: any[];
}

type ProductResult =
  | { status: "loading" }
  | { status: "ready"; value: Product; docs: any; variables: Section[] }
  | { status: "error"; error: Error };

const productInfo = ref<ProductResult>({ status: "loading" });

function unitsHtml(units: string): string {
  return units.replace(/([a-z])(-?\d+)/gi, "$1<sup>$2</sup>");
}

watch(
  () => props.product,
  async () => {
    try {
      const product = await axios.get<Product>(`${backendUrl}products/${props.product}`);
      const instruments = await axios.get<Instrument[]>(`${backendUrl}instruments`);
      const docs = (productData as any)[props.product];
      if (!docs) {
        const error = new Error();
        (error as any).response = { status: 404, data: "Not found" };
        productInfo.value = { status: "error", error };
      } else {
        const variables = [
          {
            id: "dimensions",
            title: "Coordinate variables",
            description: `The following one-dimensional variables define the
            coordinate system for other variables.`,
            variables: docs.dimensions,
          },
          {
            id: "common",
            title: "Common variables",
            description: `The following variables are available in all products
            of this type but additional variables may be present depending on
            the source instrument.`,
            variables: docs.common_variables,
          },
          ...docs.specific_variables.map((item: any) => {
            let instrumentId = item.type;
            if (instrumentId.endsWith("-l1c")) {
              instrumentId = instrumentId.slice(0, -4);
            } else if (instrumentId.endsWith("-single")) {
              instrumentId = instrumentId.slice(0, -7);
            }
            const instrument = instruments.data.find((instrument) => instrument.id === instrumentId);
            return {
              id: `specific-${item.type}`,
              title: `${instrument?.shortName || instrument?.humanReadableName || item.type.toUpperCase()} variables`,
              description: `The following variables are available from ${
                instrument?.humanReadableName || item.type.toUpperCase()
              }.`,
              variables: item.variables,
            };
          }),
        ];
        productInfo.value = { status: "ready", value: product.data, docs, variables };
        console.log(productInfo.value);
      }
    } catch (error) {
      productInfo.value = { status: "error", error: error as Error };
    }
  },
  { immediate: true },
);
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

.variable {
  margin-bottom: 1rem;

  > table {
    margin-top: 1rem;
    margin-left: 2rem;
    max-width: 1000px;

    > tbody > tr > th {
      padding-right: 1rem;
      width: 150px;
    }
  }
}

th {
  font-weight: 500;
  text-wrap: nowrap;
}

.definition th {
  padding-right: 0.5rem;
}

code {
  background: #eee;
  padding: 2px;
  border-radius: 4px;
  font-size: 90%;
}

p {
  margin-bottom: 1rem;
  max-width: 800px;
}

ul {
  margin: 1rem 0;
}

.references {
  margin-left: 2rem;
  max-width: 800px;
  text-indent: -2rem;

  li + li {
    margin-top: 0.5rem;
  }

  :deep(i) {
    font-style: italic;
  }
}

.product-icon {
  height: 1.1rem;
  margin-right: 0.25rem;
  vertical-align: middle;
}
</style>
