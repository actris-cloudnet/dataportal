<script setup lang="ts">
import defaultLogo from "@/assets/header-logo.svg";
import foolLogo from "@/assets/header-logo-fool.svg";
import xmasLogo from "@/assets/header-logo-xmas.svg";
import { ref } from "vue";

const isDev = import.meta.env.DEV;
const today = new Date();
const isXmas = !isDev && today.getMonth() === 11;
const isFool = !isDev && today.getMonth() === 3 && today.getDate() === 1;
const logo = isXmas ? xmasLogo : isFool ? foolLogo : defaultLogo;
const showMenu = ref(false);
</script>

<template>
  <header :class="{ dev: isDev, xmas: isXmas, fool: isFool }">
    <div class="container pagewidth">
      <a href="/" class="logo">
        <img :src="logo" alt="Cloudnet data portal" />
      </a>
      <div :class="{ 'menu-toggle': true, 'active': showMenu }" @click="showMenu = !showMenu">
        <div class="bar1"></div>
        <div class="bar2"></div>
        <div class="bar3"></div>
      </div>
      <ul :class="{ show: showMenu }">
        <li>
          <a href="/search">
            <span>Search data</span>
          </a>
        </li>
        <li>
          <a href="/search/visualizations">
            <span>Visualise data</span>
          </a>
        </li>
        <li style="margin-left: auto">
          <a href="https://docs.cloudnet.fmi.fi">
            <span>Documentation</span>
          </a>
        </li>
        <li>
          <a href="/sites">
            <span>Sites</span>
          </a>
        </li>
        <li>
          <a href="/products">
            <span>Products</span>
          </a>
        </li>
        <li>
          <a href="/contact">
            <span>Contact</span>
          </a>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped lang="scss">
@import "@/sass/variables.scss";

$header-height: 4.5rem;
$header-color: darken(#78c0e0, 25%);

header {
  z-index: 999;
  position: relative;
  font-weight: 500;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-image: linear-gradient(to bottom, transparent 75%, rgba(0, 0, 0, 0.05)),
      linear-gradient(to left, rgba($header-color, 0.5), $header-color 70%), url("@/assets/clouds3.jpg");
    opacity: 0.7;
    background-position: right 0px top 20%;
    background-repeat: no-repeat;
    background-size: cover;
    z-index: -1;
  }

  &.dev::before {
    background-image: linear-gradient(to bottom, transparent 75%, rgba(0, 0, 0, 0.05)),
      repeating-linear-gradient(-45deg, #ff6dbc55, #ff6dbc55 15px, #ff529855 15px, #ff529855 30px),
      linear-gradient(to left, rgba($header-color, 0.5), $header-color 70%), url("@/assets/clouds3.jpg");
  }

  &.xmas::before {
    background-image: linear-gradient(to bottom, transparent 75%, rgba(0, 0, 0, 0.05)), url("@/assets/snow.png"),
      linear-gradient(to left, rgba($header-color, 0.5), $header-color 70%), url("@/assets/clouds3.jpg");
    background-size: auto, auto, auto, cover;
    background-repeat: no-repeat, repeat, no-repeat, no-repeat;
  }

  &.fool::before {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 1)), url("@/assets/clouds3.jpg");
  }
}

.container {
  display: flex;
  align-items: center;
  height: $header-height;
  padding-top: 0;
  padding-bottom: 0;
}

img {
  display: block;
}

.logo {
  flex-shrink: 0;

  img {
    height: 2.5rem;
    filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.05));

    header.xmas & {
      transform: scale(1.8);
      padding: 0 2rem;
    }

    header.fool & {
      filter: drop-shadow(1px 2px 2px rgba(255, 0, 0, 0.5));
    }
  }
}

ul {
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

  span {
    padding: 0.25rem 0;
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
  }

  &:hover {
    text-decoration: none;
    opacity: 0.9;
  }
}

.bar1,
.bar2,
.bar3 {
  width: 32px;
  height: 3px;
  background-color: white;
  margin: 8px 0;
  border-radius: 2px;
}

.menu-toggle {
  display: none;
  padding: 1rem;
  color: white;

  &.active {
    .bar1 {
      transform: translate(0, 11px) rotate(-45deg);
    }

    .bar2 {
      opacity: 0;
    }

    .bar3 {
      transform: translate(0, -11px) rotate(45deg);
    }
  }
}

@media screen and (max-width: 800px) {
  .menu-toggle {
    display: block;
    margin-left: auto;
  }

  ul {
    display: none;
    position: absolute;
    top: $header-height;
    left: 0;
    right: 0;
    background-color: white;
    padding: 0;
    margin: 0;
    box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.25);

    &.show {
      display: block;
    }
  }

  li a {
    color: black;
    margin: 0;
    padding: 0.5rem 1rem;
  }
}
</style>
