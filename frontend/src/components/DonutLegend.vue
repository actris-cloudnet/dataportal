<template>
  <div class="legend">
    <div class="header" id="label-0" :title="props.data[0].title">{{ props.data[0].label }}</div>
    <div class="data" id="value-0" :title="props.data[0].title" :style="{ fontSize: props.fontSize }">
      {{ props.data[0].value }}
    </div>
    <div class="header" id="label-1" :title="props.data[1].title">{{ props.data[1].label }}</div>
    <div class="data" id="value-1" :title="props.data[1].title" :style="{ fontSize: props.fontSize }">
      {{ props.data[1].value }}
    </div>
    <div class="header" id="label-2" :title="props.data[2].title">{{ props.data[2].label }}</div>
    <div class="data" id="value-2" :title="props.data[2].title" :style="{ fontSize: props.fontSize }">
      {{ props.data[2].value }}
    </div>
    <div class="header" id="label-3" :title="props.data[3].title">{{ props.data[3].label }}</div>
    <div class="data" id="value-3" :title="props.data[3].title" :style="{ fontSize: props.fontSize }">
      {{ props.data[3].value }}
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  data: { label: string; title?: string; value: number }[];
  fontSize?: string;
}>();
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

.legend {
  background-color: rgba(0, 0, 0, 0.01);
  padding: 1rem;
  block-size: max-content;
  inline-size: max-content;
  display: grid;
  justify-items: center;
  grid-template-columns: repeat(4, 6em);
  border: thin solid rgba(0, 0, 0, 0.3);
  border-radius: 4px;

  .header {
    grid-row: 1;
    font-size: 100%;
    font-weight: 400;
    align-self: end;
  }

  .data {
    align-self: start;
    grid-row: 2;
    font-size: 250%;
    font-weight: 400;
  }

  #label-0 {
    grid-column: 1;
  }

  #label-1 {
    grid-column: 2;
  }

  #label-2 {
    grid-column: 3;
  }

  #label-3 {
    grid-column: 4;
  }

  #value-0 {
    grid-column: 1;
  }

  #value-1 {
    grid-column: 2;
  }

  #value-2 {
    grid-column: 3;
  }

  #value-3 {
    grid-column: 4;
  }
}

@media screen and (max-width: variables.$narrow-screen) {
  .legend {
    grid-template-rows: repeat(4, auto);
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-left: auto;
    margin-right: auto;

    #label-2 {
      grid-column: 1;
      grid-row: 3;
    }

    #label-3 {
      grid-column: 2;
      grid-row: 3;
    }

    #value-2 {
      grid-column: 1;
      grid-row: 4;
    }

    #value-3 {
      grid-column: 2;
      grid-row: 4;
    }
  }
}
</style>
