<template>
  <footer>
    <div class="container pagewidth">
      <div class="item">
        Contact:<br />
        <a href="mailto:actris-cloudnet@fmi.fi">actris-cloudnet@fmi.fi</a><br />
        <a href="https://github.com/actris-cloudnet/">GitHub organization</a>
      </div>
      <div class="item hidden-links">
        <span>&copy; <a href="https://en.ilmatieteenlaitos.fi/">Finnish Meteorological Institute</a></span>
        <div class="small">
          <a href="https://www.flickr.com/photos/theaucitron/5810163712/">Header photo</a>
          by <a href="https://www.flickr.com/photos/theaucitron/">theaucitron</a>,
          <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a>.<br />
          Icons from <a href="https://icons8.com/">icons8.com</a>.
        </div>
      </div>
      <div class="item">
        <a href="https://docs.cloudnet.fmi.fi/api/data-portal.html">API documentation</a><br />
        <router-link to="/privacy">Privacy policy</router-link><br />
        <span class="hidden-links">
          Version:
          <a :href="`https://github.com/actris-cloudnet/dataportal/tree/v${dataportalVersion}`">
            {{ dataportalVersion }}
          </a>
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const dataportalVersion = import.meta.env.DATAPORTAL_VERSION;
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

footer {
  background: #fdfdfd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.container {
  padding-top: 0;
  padding-bottom: 0;
  height: 7rem;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
}

@media screen and (max-width: $narrow-screen) {
  .container {
    flex-direction: column;
    height: auto;
    padding: 1rem;
    gap: 1rem;
  }
}

.item {
  color: darkgrey;
  font-size: 95%;
  text-align: center;
}

.small a,
.hidden-links a {
  color: inherit;
}

.small {
  font-size: 60%;
}
</style>
