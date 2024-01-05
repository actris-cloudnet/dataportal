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
        @click="handleClick($event, selectRow, item)"
        @dblclick="handleClick($event, navigateToRow, item)"
        :class="{ selected: selectable && item === selectedRow }"
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

<script lang="ts" setup generic="T extends Record<string, any>">
import { ref, computed, type Ref, nextTick, watch } from "vue";
import { useRouter, type RouteLocationRaw } from "vue-router";

export interface Field<T> {
  key: string;
  label: string;
  tdClass?: string;
  tdStyle?: (item: T) => Record<string, string>;
}

export interface Props<T> {
  items: T[];
  keyField: string;
  fields: Field<T>[];
  currentPage: number;
  perPage: number;
  busy: boolean;
  link?: (item: T) => RouteLocationRaw;
  selectable: boolean;
}

const props = defineProps<Props<T>>();

const router = useRouter();

const emit = defineEmits<{
  (e: "rowSelected", item: T): void;
  (e: "update:currentPage", value: number): void;
}>();

const selectedRow: Ref<T | null> = ref(null);

const visibleItems = computed(() =>
  props.items.slice((props.currentPage - 1) * props.perPage, props.currentPage * props.perPage),
);

function handleClick(event: MouseEvent, handler: (item: T) => void, row: T) {
  if (!props.selectable || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;
  event.preventDefault();
  handler(row);
}

function selectRow(row: T) {
  if (row === selectedRow.value) return;
  selectedRow.value = row;
  emit("rowSelected", row);
}

function navigateToRow(row: T) {
  if (!props.link) return;
  router.push(props.link(row));
}

function keyDown(event: KeyboardEvent) {
  if (!selectedRow.value) return;
  const index = props.items.indexOf(selectedRow.value);
  if (event.code == "ArrowUp") {
    if (index !== 0) {
      selectRow(props.items[index - 1]);
      if (index % props.perPage === 0) {
        emit("update:currentPage", props.currentPage - 1);
      }
    }
    event.preventDefault();
  } else if (event.code == "ArrowDown") {
    if (index !== props.items.length - 1) {
      selectRow(props.items[index + 1]);
      if (index % props.perPage === props.perPage - 1) {
        emit("update:currentPage", props.currentPage + 1);
      }
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

watch(
  () => props.perPage,
  (perPage) => {
    let newPage = 1;
    if (selectedRow.value) {
      const index = props.items.indexOf(selectedRow.value);
      newPage = Math.floor(index / perPage) + 1;
    }
    emit("update:currentPage", newPage);
  },
);
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

  &:not(.selected):hover {
    background-color: darken($blue-dust, 5%);
  }

  &.selected {
    background: darken($blue-dust, 25%);
  }
}
</style>
