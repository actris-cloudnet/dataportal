<template>
  <div>
    <LandingHeader title="About" />
    <main class="pagewidth">
      <p>
        The ACTRIS Cloudnet data portal provides data processing and curation services for ground-based remote sensing
        measurements of clouds and turbulent atmospheric properties. The portal centralises processing, quality control,
        provenance tracking, harmonisation, and archiving of data collected from
        <router-link :to="{ name: 'Sites' }">a network of ground-based stations</router-link>, primarily operated by
        European research institutes and universities.
      </p>
      <p>Major objectives of the data portal include:</p>
      <ul>
        <li>
          Curation of continuous, long-term data sets of ground-based remote sensing measurements for studying cloud
          microphysical processes,
        </li>
        <li>Development and validation of new synergistic remote sensing algorithms,</li>
        <li>
          Evaluation of the representation of clouds and other atmospheric parameters in numerical weather prediction
          (NWP) models, and
        </li>
        <li>Serving as a reference data set for the validation of satellite-based measurements.</li>
      </ul>
      <p>
        The data portal is developed by the Cloud Remote Sensing Data Centre Unit (CLU) as part of the
        <a href="https://data.actris.eu/about">ACTRIS Data Centre</a> and in collaboration with
        <a href="https://ccres.aeris-data.fr">CCRES Central Facility</a>, and is hosted at the
        <a href="https://en.ilmatieteenlaitos.fi/">Finnish Meteorological Institute</a>.
      </p>
      <p>
        Cloudnet originated as an EU project that ran from 2001 to 2005 and then continued on a voluntary basis. Since
        2011, Cloudnet has been part of <a href="https://www.actris.eu">ACTRIS research infrastructure</a>. Operational
        activities are funded by <a href="https://www.aka.fi/en/">Research Council of Finland</a> and
        <a href="https://lvm.fi/en/home">Ministry of Transport and Communications</a>. Over the years, Cloudnet has been
        involved in the following projects:
      </p>
      <div class="projects">
        <a class="project cloudnet" href="https://cordis.europa.eu/project/id/EVK2-CT-2000-00065" target="_blank">
          <img :src="cloudnetOldLogo" class="project-logo" />
          <h2 class="project-name">CLOUD-NET</h2>
          <div class="project-date">2001 – 2005</div>
        </a>
        <a class="project actris" href="https://www.actris.eu" target="_blank">
          <img :src="actrisLogo" class="project-logo" />
          <h2 class="project-name">ACTRIS</h2>
          <div class="project-date">2011 –</div>
        </a>
        <a class="project envri-fair" href="https://envri.eu/the-envri-fair-project/" target="_blank">
          <img :src="envriFairLogo" class="project-logo" />
          <h2 class="project-name">ENVRI-FAIR</h2>
          <div class="project-date">2019 – 2023</div>
        </a>
        <a class="project atmo-access" href="https://www.atmo-access.eu/" target="_blank">
          <img :src="atmoAccessLogo" class="project-logo" />
          <h2 class="project-name">ATMO-ACCESS</h2>
          <div class="project-date">2021 – 2025</div>
        </a>
        <a class="project ri-urbans" href="https://riurbans.eu/" target="_blank">
          <img :src="riUrbansLogo" class="project-logo" />
          <h2 class="project-name">RI-URBANS</h2>
          <div class="project-date">2021 – 2025</div>
        </a>
        <a class="project cargo-act" href="https://cargo-act.eu/" target="_blank">
          <img :src="cargoActLogo" class="project-logo" />
          <h2 class="project-name">CARGO-ACT</h2>
          <div class="project-date">2024 – 2027</div>
        </a>
        <a class="project certainty" href="https://certainty-aci.eu/" target="_blank">
          <img :src="certaintyLogo" class="project-logo" />
          <h2 class="project-name">CERTAINTY</h2>
          <div class="project-date">2024 – 2027</div>
        </a>
        <a class="project iriscc" href="https://www.iriscc.eu/" target="_blank">
          <img :src="irisccLogo" class="project-logo" />
          <h2 class="project-name">IRISCC</h2>
          <div class="project-date">2024 – 2028</div>
        </a>
        <a class="project polarin" href="https://eu-polarin.eu/" target="_blank">
          <img :src="polarinLogo" class="project-logo" />
          <h2 class="project-name">POLARIN</h2>
          <div class="project-date">2024 – 2029</div>
        </a>
        <a class="project diva" href="https://diva.inoe.ro/" target="_blank">
          <img :src="divaLogo" class="project-logo" />
          <h2 class="project-name">DIVA IV</h2>
          <div class="project-date">2025 – 2026</div>
        </a>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import LandingHeader from "@/components/LandingHeader.vue";
import actrisLogo from "@/assets/logos/actris.svg";
import envriFairLogo from "@/assets/logos/envri-fair.png";
import atmoAccessLogo from "@/assets/logos/atmo-access.png";
import riUrbansLogo from "@/assets/logos/ri-urbans.png";
import cloudnetOldLogo from "@/assets/logos/cloudnet-old.png";
import certaintyLogo from "@/assets/logos/certainty.png";
import polarinLogo from "@/assets/logos/polarin.png";
import divaLogo from "@/assets/logos/diva.png";
import cargoActLogo from "@/assets/logos/cargo-act.png";
import irisccLogo from "@/assets/logos/iriscc.png";
</script>

<style scoped lang="scss">
:deep(.pagewidth) {
  max-width: 800px;
}

p {
  margin-bottom: 1rem;
}

ul {
  list-style: disc;
  padding-left: 2rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

th {
  font-weight: 500;
  border-bottom: 1px solid silver;
}

th,
td {
  padding: 0.25rem;
}

td:nth-child(3),
td:nth-child(4) {
  text-align: center;
}

.projects {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1.5rem;
  text-align: center;
  margin-bottom: 2rem;
}

.project {
  color: inherit;

  &:hover {
    opacity: 0.75;
    text-decoration: none;
  }
}

.project-logo {
  object-fit: contain;
  width: 100%;
  height: 100px;

  // Adjust size to make logo sizes consistent.
  .ri-urbans & {
    padding: 1.5rem;
  }
  .envri-fair &,
  .diva &,
  .cargo-act & {
    padding: 0.5rem;
  }
}

.project-name {
  font-weight: 500;
}

.project-date {
  color: gray;
  font-size: 75%;
}
</style>
