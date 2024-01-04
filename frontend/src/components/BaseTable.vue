<template>
  <div class="table" role="grid" :aria-busy="busy" @focusin="focusIn" @focusout="focusOut">
    <div class="thead">
      <div class="tr">
        <div class="th" v-for="field in fields" :key="field.key">
          {{ field.label }}
        </div>
      </div>
    </div>
    <div class="tbody">
      <a
        v-for="item in visibleItems"
        :key="item[keyField]"
        class="tr"
        :href="link ? router.resolve(link(item)).href : ''"
        tabindex="-1"
        @click.prevent="clickRow(item)"
        @dblclick.prevent="doubleClickRow(item)"
        :class="{ selected: item === selectedRow }"
      >
        <div
          class="td"
          v-for="field in fields"
          :key="field.key"
          :class="field.tdClass"
          :style="field.tdStyle ? field.tdStyle(item) : ''"
        >
          <slot :name="`cell(${field.key})`" :item="item">
            {{ item[field.key] }}
          </slot>
        </div>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRouter, type RouteLocationRaw } from "vue-router";

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
  link?: (item: any) => RouteLocationRaw;
}

const props = defineProps<Props>();

const router = useRouter();

const emit = defineEmits<{
  (e: "rowSelected", item: any): void;
}>();

const selectedRow = ref<any>(null);

const visibleItems = computed(() =>
  props.items.slice((props.currentPage - 1) * props.perPage, props.currentPage * props.perPage),
);

function clickRow(row: any) {
  selectedRow.value = row;
  emit("rowSelected", row);
}

function doubleClickRow(row: any) {
  if (!props.link) return;
  router.push(props.link(row));
}

function keyDown(event: KeyboardEvent) {
  if (!selectedRow.value) return;
  const index = visibleItems.value.indexOf(selectedRow.value);
  if (event.code == "ArrowUp") {
    if (index > 0) {
      clickRow(visibleItems.value[index - 1]);
    }
    event.preventDefault();
  } else if (event.code == "ArrowDown") {
    if (index < visibleItems.value.length - 1) {
      clickRow(visibleItems.value[index + 1]);
    }
    event.preventDefault();
  }
}

function focusIn(event: FocusEvent) {
  window.addEventListener("keydown", keyDown);
}

function focusOut(event: FocusEvent) {
  window.removeEventListener("keydown", keyDown);
}
</script>

<style lang="scss" scoped>
@import "@/sass/variables.scss";

$cell-padding: 9px;
$header-padding: 5px;

.table {
  display: table;
  border-collapse: collapse;
  width: 100%;

  &[aria-busy="true"] {
    opacity: 0.5;
    pointer-events: none;
  }
}

.thead {
  display: table-header-group;
}

.tbody {
  display: table-row-group;
}

.tr {
  display: table-row;
  color: inherit;
  text-decoration: inherit;
}

.th {
  display: table-cell;
  padding: $header-padding $cell-padding;
  font-weight: 500;
}

.td {
  display: table-cell;
  padding: $cell-padding;
}

.tbody .tr {
  cursor: pointer;

  &:nth-child(odd) {
    background-color: $blue-dust;
  }

  &.selected {
    background: darken($blue-dust, 25%);
  }
}
</style>
