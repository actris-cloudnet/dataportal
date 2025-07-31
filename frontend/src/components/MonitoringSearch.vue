<template>
  <main id="monitoring-search">
    <div id="searchContainer">
      <div id="sideBar">Hello</div>
    </div>
    <div id="results"></div>
  </main>
</template>

<script lang="ts" setup></script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

$lightpadding: 1rem;
$heavypadding: 5rem;

main#monitoring-search {
  padding-left: $lightpadding;
  padding-right: $lightpadding;
}

#searchContainer {
  display: flex;
  justify-content: center;
}

#sideBar {
  margin-right: 80px;
  width: 300px;
  padding: 2rem 0;
  flex-basis: 300px;
  flex-shrink: 0;
}

#results {
  display: inline-flex;
  flex-grow: 1;
}

@media screen and (max-width: variables.$page-width) {
  main#monitoring-search {
    padding-left: $lightpadding;
    padding-right: $lightpadding;
  }
}

@media screen and (max-width: variables.$narrow-screen) {
  #searchContainer {
    flex-direction: column;
    align-items: center;
  }
  #sideBar {
    margin-right: 0;
  }
  #results {
    width: 100%;
  }
}
</style>
