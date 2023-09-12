<script setup lang="ts">
import headerLogo from "@/assets/header-logo.svg";
const isDev = import.meta.env.NODE_ENV != "production";
</script>

<template>
  <header :class="{ dev: isDev }">
    <div class="container">
      <a href="/" class="logo">
        <img :src="headerLogo" alt="Cloudnet data portal" />
      </a>
      <ul>
        <li>
          <a href="/search">
            <span>Browse data</span>
          </a>
        </li>
        <li>
          <a href="/search/visualizations">
            <span>Visualize data</span>
          </a>
        </li>
        <li style="margin-left: auto">
          <a href="/sites">
            <span>Measurement sites</span>
          </a>
        </li>
        <li>
          <a href="https://docs.cloudnet.fmi.fi">
            <span>Documentation</span>
          </a>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped lang="scss">
@import "@/sass/new-variables";

$header-color: darken(#78c0e0, 25%);

header {
  background-image: linear-gradient(to bottom, transparent 75%, rgba(0, 0, 0, 0.05)),
    linear-gradient(to left, rgba($header-color, 0.5), $header-color 70%), url("@/assets/clouds3.jpg");
  opacity: 0.7;
  background-position: right 0px top 20%;
  background-repeat: no-repeat;
  background-size: cover;

  &.dev {
    background-image: linear-gradient(to bottom, transparent 75%, rgba(0, 0, 0, 0.05)),
      repeating-linear-gradient(-45deg, #ff6dbc55, #ff6dbc55 15px, #ff529855 15px, #ff529855 30px),
      linear-gradient(to left, rgba($header-color, 0.5), $header-color 70%), url("@/assets/clouds3.jpg");
  }
}

.container {
  display: flex;
  align-items: center;
  max-width: $page-width;
  box-sizing: content-box;
  margin: 0 auto;
  height: 4.5rem;
  padding: 0 1rem;
}

img {
  display: block;
}

.logo img {
  max-width: 100%;
  height: 2.5rem;
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.05));
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  margin-left: 1rem;
  font-size: 1.1rem;
  text-align: center;
  width: 100%;
}

li a {
  color: white;
  padding: 0.5rem;
  margin-left: 1rem;
  display: flex;
  opacity: 0.9;

  &:hover {
    text-decoration: none;
    opacity: 1;
  }

  span {
    padding: 0.25rem 0;
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
  }

  &.router-link-active {
    opacity: 1;

    span {
      border-bottom: 2px solid white;
    }
  }

  img {
    width: auto;
    height: 1.4rem;
    margin-right: 0.5rem;
  }
}
</style>
