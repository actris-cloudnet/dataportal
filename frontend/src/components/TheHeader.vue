<script setup lang="ts">
import defaultLogo from "@/assets/header-logo.svg";
import xmasLogo from "@/assets/header-logo-xmas.svg";
import actrisLogo from "@/assets/logos/actris-white.svg";
import axios from "axios";
import { backendUrl } from "@/lib";
import { loginStore, logout, hasPermission } from "@/lib/auth";
import { ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import BaseModal from "@/components/BaseModal.vue";
import BaseButton from "@/components/BaseButton.vue";

const isDev = import.meta.env.DEV;
const today = new Date();
const isXmas = !isDev && today.getMonth() === 11 && today.getDate() > 15;
const logo = isXmas ? xmasLogo : defaultLogo;
const showMenu = ref(false);
const showProfileMenu = ref(false);
const showTokenModal = ref(false);
const apiToken = ref("");
const tokenError = ref("");
const copied = ref(false);
const generating = ref(false);
const router = useRouter();
const $profileMenu = useTemplateRef<HTMLDivElement>("$profileMenu");
const $tokenInput = useTemplateRef<HTMLInputElement>("$tokenInput");

async function clickLogout() {
  await logout();
  await router.push({ name: "Frontpage" });
  showMenu.value = false;
  showProfileMenu.value = false;
}

function clickApiToken() {
  apiToken.value = "";
  tokenError.value = "";
  copied.value = false;
  generating.value = false;
  showTokenModal.value = true;
}

async function generateToken() {
  generating.value = true;
  tokenError.value = "";
  try {
    const res = await axios.post<{ token: string }>(`${backendUrl}auth/token`);
    apiToken.value = res.data.token;
  } catch {
    tokenError.value = "Failed to generate API token.";
  } finally {
    generating.value = false;
  }
}

async function copyToken() {
  $tokenInput.value?.select();
  try {
    await navigator.clipboard.writeText(apiToken.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    tokenError.value = "Failed to copy token.";
  }
}

function closeTokenModal() {
  showTokenModal.value = false;
  apiToken.value = "";
  tokenError.value = "";
  copied.value = false;
}

function toggleProfileMenu() {
  if (showProfileMenu.value) {
    hideProfileMenu();
  } else {
    openProfileMenu();
  }
}

function openProfileMenu() {
  showProfileMenu.value = true;
  document.body.addEventListener("click", clickEvent);
}

function hideProfileMenu() {
  showProfileMenu.value = false;
  document.body.removeEventListener("click", clickEvent);
}

function clickEvent(event: MouseEvent) {
  if ($profileMenu.value && event.target instanceof Node && !$profileMenu.value.contains(event.target)) {
    hideProfileMenu();
  }
}
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
      <ul class="nav" :class="{ show: showMenu }">
        <li class="nav-item">
          <a href="/search">
            <span>Search data</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="/search/visualizations">
            <span>Visualise data</span>
          </a>
        </li>
        <li class="nav-item nav-secondary">
          <router-link :to="{ name: 'Sites' }" @click="showMenu = false">
            <span>Sites</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link :to="{ name: 'Instruments' }" @click="showMenu = false">
            <span>Instruments</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link :to="{ name: 'Products' }" @click="showMenu = false">
            <span>Products</span>
          </router-link>
        </li>
        <li class="nav-item">
          <a href="https://docs.cloudnet.fmi.fi">
            <span>Documentation</span>
          </a>
        </li>
        <li class="nav-item">
          <router-link :to="{ name: 'Contact' }" @click="showMenu = false">
            <span>Contact</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link v-if="!loginStore.isAuthenticated" :to="{ name: 'Login' }"> Login </router-link>
          <div v-else class="nav-item dropdown" ref="$profileMenu">
            <a @click="toggleProfileMenu">
              <svg class="user-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                <path
                  d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"
                />
              </svg>
              <span class="dropdown-title">{{ loginStore.name }}</span>
              <svg class="caret" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                <path
                  d="M300.3 440.8C312.9 451 331.4 450.3 343.1 438.6L471.1 310.6C480.3 301.4 483 287.7 478 275.7C473 263.7 461.4 256 448.5 256L192.5 256C179.6 256 167.9 263.8 162.9 275.8C157.9 287.8 160.7 301.5 169.9 310.6L297.9 438.6L300.3 440.8z"
                />
              </svg>
            </a>
            <ul v-if="showProfileMenu" class="dropdown-items">
              <li v-if="hasPermission('canPublishTask').value">
                <router-link :to="{ name: 'Queue' }" @click="showMenu = showProfileMenu = false">Queue</router-link>
              </li>
              <li v-if="hasPermission('canGetStats').value">
                <router-link :to="{ name: 'Statistics' }" @click="showMenu = showProfileMenu = false">
                  Statistics
                </router-link>
              </li>
              <li class="name">{{ loginStore.name }}</li>
              <li><a @click="clickApiToken">API token</a></li>
              <li><a @click="clickLogout">Log out</a></li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  </header>

  <Teleport to="body">
    <BaseModal :open="showTokenModal" @submit="closeTokenModal">
      <template #header>
        <h3>API token</h3>
      </template>
      <template #body>
        <p class="token-hint">Generate an API token for programmatic access to the instrument log API.</p>
        <p v-if="tokenError" class="error">{{ tokenError }}</p>
        <template v-else-if="apiToken">
          <p class="token-hint">
            Use this token with the <code>X-Auth-Token</code> header. It is valid for 30 days. Copy it now — it won't be
            shown again.
          </p>
          <input
            ref="$tokenInput"
            class="token-input"
            :value="apiToken"
            readonly
            @focus="($event.target as HTMLInputElement).select()"
          />
        </template>
        <template v-else-if="generating">
          <p>Generating token...</p>
        </template>
      </template>
      <template #footer>
        <BaseButton v-if="!apiToken && !generating" type="primary" @click="generateToken">Generate</BaseButton>
        <BaseButton v-if="apiToken" type="primary" @click="copyToken">{{ copied ? "Copied!" : "Copy" }}</BaseButton>
        <BaseButton type="secondary" @click="closeTokenModal">Close</BaseButton>
      </template>
    </BaseModal>
  </Teleport>
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

.nav {
  display: flex;
  align-items: center;
  margin-left: 1rem;
  font-size: 1.1rem;
  width: 100%;
}

.nav-item {
  cursor: default;
}

.nav-item > a {
  color: white;
  padding: 0.5rem;
  margin-left: 1rem;
  display: flex;
  align-items: center;

  &:hover,
  &:focus-visible {
    text-decoration: none;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
}

.nav-secondary {
  margin-left: auto;
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
}

.caret {
  width: 16px;
  height: 16px;
  fill: white;
}

.dropdown {
  position: relative;
}

.dropdown-items {
  position: absolute;
  top: 2.5rem;
  right: 0;
  width: 150px;
  background: white;
  border-radius: 4px;
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  li a {
    display: block;
    color: black;
    padding: 0.5rem;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      background: #eee;
    }
  }

  .name {
    color: gray;
    font-weight: 400;
    font-size: 80%;
    padding: 0.5rem;
    padding-bottom: 0;
  }
}

.dropdown-title {
  display: none;
}

@media screen and (max-width: 1200px) {
  .menu-toggle {
    display: block;
    margin-left: auto;
  }

  .nav {
    display: none;
    position: absolute;
    top: $header-height;
    left: 0;
    right: 0;
    background-color: white;
    padding: 0;
    margin: 0;
    box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.25);
    text-align: left;

    &.show {
      display: block;
    }

    li a {
      color: black;
      margin: 0;
      padding: 0.5rem 1rem;
    }
  }

  .dropdown,
  .nav-secondary {
    border-top: 1px solid #eee;
  }

  .dropdown-items {
    position: relative;
    top: 0;
    width: 100%;
    background: none;
    border-radius: 0;
    box-shadow: none;
  }

  .dropdown-title {
    display: block;
  }

  .user-icon {
    margin-right: 0.25rem;
  }

  .user-icon,
  .caret {
    fill: black;
  }

  .caret {
    margin-left: auto;
  }

  .name {
    display: none;
  }
}

.token-hint {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: #555;

  code {
    background: #f0f0f0;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-size: 0.85rem;
  }
}

.token-input {
  width: 100%;
  padding: 0.5rem;
  font-family: monospace;
  font-size: 0.85rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f8f8f8;
  box-sizing: border-box;
}
</style>
