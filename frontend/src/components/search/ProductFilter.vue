<template>
<div class="filterbox">
<CustomMultiselect
label="Product"
v-model="selectedProductIds"
:options="productOptions"
id="productSelect"
:multiple="true"
:getIcon="getProductIcon"
/>
<CheckBox
id="showExpProductsCheckbox"
class="checkbox"
v-model="showExpProducts"
label="Show experimental products"
/>
</div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import type { Product } from "@shared/entity/Product";
import CustomMultiselect from "@/components/MultiSelect.vue";
import CheckBox from "@/components/CheckBox.vue";
import { useRouteQuery, queryBoolean, queryStringArray } from "@/lib/useRouteQuery";
import { backendUrl, getProductIcon} from "@/lib";
import { alphabeticalSort } from "@/lib/SearchUtils";

// products
const allProducts = ref<Product[]>([]);
const selectedProductIds = useRouteQuery({ name: "product", defaultValue: [], type: queryStringArray });
const showExpProducts = useRouteQuery({ name: "experimental", defaultValue: false, type: queryBoolean });

const productOptions = computed(() =>
allProducts.value.filter((product) => showExpProducts.value || !product.experimental),
);


onMounted(async () => {
const products = await axios.get<Product[]>(`${backendUrl}products/variables`);
allProducts.value = products.data.sort(alphabeticalSort);

if (
!showExpProducts.value &&
selectedProductIds.value.some((productId) => {
const product = allProducts.value.find((product) => product.id === productId);
return product && product.experimental;
})
) {
showExpProducts.value = true;
}
});
</script>
