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
      <template #clear>
        <div
          class="multiselect__clear"
          v-if="clearable && !multiple && internalModel"
          @mousedown="internalModel = null"
        ></div>
      </template>
      <template #noResult>
        <span id="noRes">Not found</span>
      </template>
    </VueMultiselect>
  </div>
</template>

<script lang="ts" setup generic="T extends Option">
import VueMultiselect from "vue-multiselect";
import { compareValues, notEmpty } from "@/lib";
import { computed, ref, watch } from "vue";

export interface Option {
  id: string;
  humanReadableName: string;
  shortName?: string;
  stationName?: string | null;
}

interface Props {
  id: string;
  label: string;
  options: T[];
  getIcon?: (option: T) => string;
  multiple?: boolean;
  disabled?: boolean;
  clearable?: boolean;
}

const props = defineProps<Props>();

const model = defineModel<string | string[] | null>({ required: true });

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
    if (Array.isArray(model.value)) {
      return model.value.map((v) => props.options.find((option) => option.id === v)).filter(notEmpty);
    } else {
      const result = props.options.find((option) => option.id === model.value);
      return result !== undefined ? result : null;
    }
  },
  set(value) {
    model.value = Array.isArray(value) ? value.map((v) => v.id) : value != null ? value.id : null;
  },
});

const optionIndex = computed<{ term: string; option: Option }[]>(() =>
  props.options.flatMap((option) => {
    const output = [
      { term: option.id, option },
      { term: normalizeGeneric(option.humanReadableName), option },
      { term: normalizeGerman(option.humanReadableName), option },
    ];
    if (typeof option.shortName !== "undefined") {
      output.push({ term: normalizeGeneric(option.shortName), option });
      output.push({ term: normalizeGerman(option.shortName), option });
    }
    if (option.stationName) {
      output.push({ term: normalizeGeneric(option.stationName), option });
      output.push({ term: normalizeGerman(option.stationName), option });
    }
    return output;
  }),
);

const filteredOptions = computed(() => {
  const results = optionIndex.value
    .map((item) => {
      const i = item.term.indexOf(searchQuery.value);
      let score;
      if (i === -1) {
        score = 0;
      } else if (i === 0) {
        score = 3;
      } else if (item.term.charAt(i - 1) === " ") {
        score = 2;
      } else {
        score = 1;
      }
      return { option: item.option, score };
    })
    .filter((data) => data.score > 0)
    .sort((a, b) => compareValues(b.score, a.score))
    .map((data) => data.option);
  return [...new Set(results)];
});

// If the list of possible options change, remove invalid values from selection.
watch(
  () => props.options,
  (options) => {
    if (Array.isArray(model.value)) {
      model.value = model.value.filter((selectedId) => options.find((product) => product.id === selectedId));
    } else if (!options.some((option) => option.id === model.value)) {
      model.value = null;
    }
  },
);
</script>

<!-- <style src="vue-multiselect/dist/vue-multiselect.css"></style> -->

<style lang="scss">
@use "@/sass/variables.scss";

.multiselect {
  position: relative;
  width: 100%;
}

.multiselect__tags {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;

  .multiselect--active & {
    // border: 1px solid transparent;
    // box-shadow: 0 0 0 2px slateblue;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}

.multiselect__placeholder,
.multiselect__input::placeholder {
  color: gray;
}

.multiselect__content-wrapper {
  position: absolute;
  display: block;
  background: white;
  width: 100%;
  max-height: 240px;
  overflow: auto;
  border: 1px solid #ddd;
  border-top: none;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  z-index: 50;
}

.multiselect__content {
  width: 100%;
}

.multiselect__option {
  display: block;
  padding: 0.5rem;

  &--highlight {
    color: black;
    background-color: variables.$steel-warrior;
  }
}

// .multiselect__input {
//   padding: 2px;
//   padding-left: 5px;

//   &::placeholder {
//     color: gray;
//   }
// }

// .multiselect__placeholder {
//   padding-left: 5px;
//   color: gray;
//   line-height: 20px;
//   font-size: 16px;
// }

// .multiselect__tags-wrap {
//   .multiselect__tag,
//   .multiselect__tag i:hover {
//     color: black;
//     background-color: variables.$steel-warrior;
//   }
// }

// .multiselect__element {
//   font-size: 90%;
//   color: black;

//   .multiselect__option--highlight {
//     color: black;
//     background-color: variables.$steel-warrior;

//     .custom-option {
//       background-color: variables.$steel-warrior;
//     }
//   }

//   .multiselect__option--selected {
//     background-color: white;
//     pointer-events: none;

//     .custom-option {
//       background-color: white;
//       font-weight: normal;
//       color: #bbbbbb;

//       img {
//         opacity: 0.5;
//       }

//       .option__tag {
//         font-size: 75%;
//         font-weight: bold;
//         color: white;
//         background-color: rgba(variables.$experimental, 0.3);
//       }
//     }
//   }
// }

// .multiselect__tag-icon::after {
//   color: gray;
// }

.multiselect__tag {
  position: relative;
  display: inline-block;
  padding: 4px 26px 4px 10px;
  border-radius: 4px;
  margin-right: 10px;
  line-height: 1;
  background-color: variables.$steel-warrior;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
  text-overflow: ellipsis;
}

.multiselect__tag.experimental-background,
.multiselect__tag.experimental-background i:hover {
  background-color: rgba(variables.$experimental, 0.3);
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
  border-radius: 4px;
  background-color: variables.$experimental;
  margin-left: 0.4em;
  padding: 0.2em 0.4em;
  font-size: 75%;
  font-weight: bold;
  color: white;
}

// .multiselect__clear {
//   position: absolute;
//   right: 41px;
//   height: 40px;
//   width: 20px;
//   display: block;
//   cursor: pointer;
//   z-index: 3;

//   &:hover {
//     opacity: 0.75;
//   }

//   &::before,
//   &::after {
//     content: "";
//     display: block;
//     position: absolute;
//     width: 3px;
//     height: 16px;
//     background: #aaa;
//     top: 12px;
//     right: 4px;
//   }

//   &::before {
//     transform: rotate(45deg);
//   }

//   &::after {
//     transform: rotate(-45deg);
//   }
// }
</style>
