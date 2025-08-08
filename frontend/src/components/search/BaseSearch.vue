<template>
  <main>
    <div id="searchContainer">
      <section class="sideBar">
        <slot name="filters" />
      </section>
      <div class="results">
        <slot name="results" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts"></script>
