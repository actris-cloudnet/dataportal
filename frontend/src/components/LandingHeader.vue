<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
}

defineProps<Props>();
</script>

<template>
  <div>
    <header class="pagewidth">
      <h1 class="title">{{ title }}</h1>
      <div class="subtitle" v-if="subtitle">
        {{ subtitle }}
      </div>
      <div class="tags" v-if="$slots.tags">
        <slot name="tags"></slot>
      </div>
      <div class="actions" v-if="$slots.actions">
        <slot name="actions"></slot>
      </div>
    </header>
    <nav class="tab-container">
      <slot name="tabs"></slot>
    </nav>
  </div>
</template>

<style scoped lang="scss">
@import "@/sass/new-variables.scss";

header {
  display: grid;
  grid-template-columns: minmax(min-content, max-content) auto min-content;
  align-items: center;
}

.title {
  grid-column: 1;
  font-size: 170%;
  font-weight: 300;
}

.subtitle {
  grid-row: 2;
  grid-column: 1 / 3;
  font-weight: 400;
  color: gray;
}

.tags {
  grid-row: 1;
  grid-column: 2;
  margin-left: 0.5rem;
}

.actions {
  margin-left: 1rem;
}

.tab-container {
  display: flex;
  justify-content: center;
  flex-direction: row;
  margin-bottom: 1rem;
}

:slotted(.tab) {
  position: relative;
  min-inline-size: max-content;
  font-size: 120%;
  margin: 0 0.5rem;
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
  text-decoration: none;
  padding: 0.5rem 0.25rem;
  line-height: 1;
  font-weight: 400;

  img {
    width: 1.1rem;
    height: 1.1rem;
    opacity: 0.75;
  }

  &.router-link-exact-active {
    color: $blue4;
    border-bottom: 2px solid $blue4;

    img {
      opacity: 1;
    }
  }
  &:hover:not(.router-link-exact-active) {
    color: black;
  }
}
</style>
