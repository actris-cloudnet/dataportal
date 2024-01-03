<template>
  <div>
    <label :for="id">{{ label }}</label>
    <VueMultiselect
      :name="id"
      :id="id"
      v-model="internalModel"
      placeholder="Select"
      track-by="id"
      label="humanReadableName"
      :options="filteredOptions"
      :show-labels="false"
      :multiple="multiple"
      :hideSelected="false"
      :internal-search="false"
      :disabled="disabled"
      @search-change="searchChange"
    >
      <template #tag="slotProps">
        <span class="multiselect__tag" :class="{ 'experimental-background': slotProps.option.experimental }">
          <img v-if="getIcon" class="option__image" :src="getIcon(slotProps.option)" alt="" />
          {{ slotProps.option.shortName || slotProps.option.humanReadableName }}
          <i class="multiselect__tag-icon" @click="slotProps.remove(slotProps.option)"></i>
        </span>
      </template>
      <template #option="slotProps">
        <span class="custom-option">
          <img v-if="getIcon" class="option__image" :src="getIcon(slotProps.option)" alt="" />
          {{ slotProps.option.shortName || slotProps.option.humanReadableName }}
          <span v-if="slotProps.option.experimental" class="option__tag">EXP</span>
        </span>
      </template>
      <template #singleLabel="slotProps">
        <img v-if="getIcon" class="option__image" :src="getIcon(slotProps.option)" alt="" />
        {{ slotProps.option.shortName || slotProps.option.humanReadableName }}
        <span v-if="slotProps.option.experimental" class="option__tag">EXP</span>
      </template>
      <template #noResult>
        <span id="noRes">Not found</span>
      </template>
    </VueMultiselect>
  </div>
</template>

<script lang="ts" setup>
import VueMultiselect from "vue-multiselect";
import { notEmpty } from "@/lib";
import { computed, ref } from "vue";
import type { PropType } from "vue";

export interface Option {
  id: string;
  humanReadableName: string;
  shortName?: string;
}

type OptionId = Option["id"];

type ModelValue = OptionId | OptionId[] | null;

const props = defineProps({
  id: { required: true, type: String },
  label: { required: true, type: String },
  options: { required: true, type: Array as PropType<Option[]> },
  getIcon: { required: false, type: Function },
  multiple: Boolean,
  // Nullable workaround: https://github.com/vuejs/core/issues/3948
  modelValue: {
    required: true,
    type: null as unknown as PropType<ModelValue>,
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    validator: (v: any) => typeof v === "string" || Array.isArray(v) || v === null,
  },
  disabled: Boolean,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: ModelValue): void;
}>();

const searchQuery = ref("");

function normalizeGeneric(input: string): string {
  return input
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase();
}

function normalizeGerman(input: string): string {
  return input.trim().normalize("NFKC").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue");
}

function searchChange(query: string) {
  searchQuery.value = normalizeGeneric(query);
}

const internalModel = computed({
  get() {
    if (Array.isArray(props.modelValue)) {
      return props.modelValue.map((v) => props.options.find((option) => option.id === v)).filter(notEmpty);
    } else {
      const result = props.options.find((option) => option.id === props.modelValue);
      return result !== undefined ? result : null;
    }
  },
  set(value) {
    emit("update:modelValue", Array.isArray(value) ? value.map((v) => v.id) : value != null ? value.id : null);
  },
});

const optionIndex = computed<[string, Option][]>(() =>
  props.options.flatMap((option) => {
    const output: [string, Option][] = [
      [option.id, option],
      [normalizeGeneric(option.humanReadableName), option],
      [normalizeGerman(option.humanReadableName), option],
    ];
    if (typeof option.shortName !== "undefined") {
      output.push([normalizeGeneric(option.shortName), option]);
      output.push([normalizeGerman(option.shortName), option]);
    }
    return output;
  }),
);

const filteredOptions = computed(() => [
  ...new Set(
    optionIndex.value.filter(([term, _option]) => term.includes(searchQuery.value)).map(([_term, option]) => option),
  ),
]);
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss">
@import "@/sass/variables.scss";

.multiselect__input {
  padding: 2px;
  padding-left: 0;

  &::placeholder {
    font-size: 88%;
    color: gray;
  }
}

.multiselect__tags-wrap {
  .multiselect__tag,
  .multiselect__tag i:hover {
    color: black;
    background-color: $steel-warrior;
  }
}

.multiselect__element {
  font-size: 90%;
  color: black;

  .multiselect__option--highlight {
    color: black;
    background-color: $steel-warrior;

    .custom-option {
      background-color: $steel-warrior;
    }
  }

  .multiselect__option--selected {
    background-color: white;
    pointer-events: none;

    .custom-option {
      background-color: white;
      font-weight: normal;
      color: #bbbbbb;

      img {
        opacity: 0.5;
      }

      .option__tag {
        font-size: 75%;
        font-weight: bold;
        color: white;
        background-color: rgba($experimental, 0.3);
      }
    }
  }
}

.multiselect__tag-icon::after {
  color: gray;
}

.option__image {
  height: 1.2em;
  width: auto;
  position: relative;
  top: -1px;
  margin-right: 0.4em;
  vertical-align: middle;
}

.option__tag {
  border-radius: 15%;
  background-color: $experimental;
  margin-left: 0.4em;
  padding: 0.2em 0.4em;
  text-align: center;
  line-height: normal;
  font-size: 75%;
  font-weight: bold;
  color: white;
}

.multiselect__tag.experimental-background,
.multiselect__tag.experimental-background i:hover {
  background-color: rgba($experimental, 0.3);
}
</style>
