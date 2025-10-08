<script setup lang="ts">
import defaultLogo from "@/assets/header-logo.svg";
import xmasLogo from "@/assets/header-logo-xmas.svg";
import actrisLogo from "@/assets/logos/actris-white.svg";
import userIcon from "@/assets/icons/user-solid-full.svg";
import { loginStore, isAuthenticated } from "@/lib/auth";
import { ref } from "vue";

const isDev = import.meta.env.DEV;
const today = new Date();
const isXmas = !isDev && today.getMonth() === 11 && today.getDate() > 15;
const logo = isXmas ? xmasLogo : defaultLogo;
const showMenu = ref(false);
</script>

<template>
  <header :class="{ dev: isDev, xmas: isXmas }">
    <div class="container pagewidth">
      <a href="/" class="logo actris-logo">
        <img :src="actrisLogo" alt="ACTRIS" />
      </a>
      <a href="/" class="logo cloudnet-logo">
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
          <a href="/instruments">
            <span>Instruments</span>
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
        <li>
          <router-link v-if="!isAuthenticated" :to="{ name: 'Login' }" class="secret" tabindex="-1">
            Login
          </router-link>
          <a v-else>
            <svg class="user-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <!--!Font Awesome Pro v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc.-->
              <path
                d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"
              />
            </svg>
            {{ loginStore.name }}
          </a>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use "sass:color";
@use "@/sass/variables.scss";

$header-height: 4.5rem;
$header-color: color.adjust(variables.$cloudnet-blue, $lightness: -25%);

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

  /*
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
    */
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
  }
}

header.xmas .cloudnet-logo img {
  transform: scale(1.8);
  padding: 0 2rem;
}

.actris-logo img {
  height: 3rem;
  padding-right: 0.3rem;
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
  align-items: center;

  span {
  }

  &:hover {
    text-decoration: none;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
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

.user-icon {
  width: 24px;
  height: 24px;
  fill: white;
  margin-right: 0.25rem;
}

@media screen and (max-width: 1000px) {
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
