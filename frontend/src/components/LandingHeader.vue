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
    <nav class="tab-container" v-if="$slots.tabs">
      <slot name="tabs"></slot>
    </nav>
  </div>
</template>

<style scoped lang="scss">
@import "@/sass/variables.scss";

header {
  display: grid;
  grid-template-columns: minmax(min-content, max-content) auto min-content;
  align-items: center;
  padding-top: 2rem;
  padding-bottom: 1rem;
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
  grid-row: 1 / 3;
  display: flex;
  gap: 0.5rem;
}

.tab-container {
  display: flex;
  justify-content: center;
  flex-direction: row;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

:slotted(.tab) {
  display: flex;
  align-items: center;
  min-width: max-content;
  font-size: 120%;
  margin: 0 0.5rem;
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
  text-decoration: none;
  padding: 0.5rem 0.25rem;
  line-height: 1;
  font-weight: 400;
  border-bottom: 2px solid transparent;

  img {
    width: 1.1rem;
    height: 1.1rem;
    opacity: 0.75;
    margin-right: 0.25rem;
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

:slotted(.tag:not(:first-child)) {
  margin-left: 0.5rem;
}

@media screen and (max-width: 600px) {
  header {
    display: flex;
    flex-direction: column;
  }

  .title,
  .subtitle {
    text-align: center;
  }

  .tags {
    margin-top: 0.5rem;
    margin-left: 0;
  }

  .actions {
    margin-top: 1rem;
    margin-left: 0;
    width: 100%;

    :slotted(.button) {
      width: 100%;
    }
  }
}
</style>
