<script lang="ts" setup>
import { ref, computed } from "vue";

export interface Field {
  key: string;
  label: string;
  tdClass?: string;
  tdStyle?: (item: any) => Record<string, string>;
}

export interface Props {
  items: any[];
  keyField: string;
  fields: Field[];
  currentPage: number;
  perPage: number;
  busy: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "rowSelected", item: any): void;
}>();

const selectedRow = ref<any>(null);

const visibleItems = computed(() =>
  props.items.slice((props.currentPage - 1) * props.perPage, props.currentPage * props.perPage),
);

function selectRow(row: any) {
  selectedRow.value = row;
  emit("rowSelected", row);
}
</script>

<style lang="sass" scoped>
@import "@/sass/variables.sass"

$cell-padding: 9px
$header-padding: 5px

table
  border-collapse: collapse
  width: 100%

  &[aria-busy=true]
    opacity: .5
    pointer-events: none

th
  padding: $header-padding $cell-padding

td
  padding: $cell-padding

tbody tr
  cursor: pointer

  &:nth-child(odd)
    background-color: $blue-dust

  &.selected
    background: darken($blue-dust, 25%)
</style>

<template>
  <table :aria-busy="busy">
    <thead>
      <tr>
        <th v-for="field in fields" :key="field.key">
          {{ field.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in visibleItems"
        :key="item[keyField]"
        @click="selectRow(item)"
        :class="{ selected: item === selectedRow }"
      >
        <td
          v-for="field in fields"
          :key="field.key"
          :class="field.tdClass"
          :style="field.tdStyle ? field.tdStyle(item) : ''"
        >
          <slot :name="`cell(${field.key})`" :item="item">
            {{ item[field.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
