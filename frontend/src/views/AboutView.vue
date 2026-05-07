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
      <table>
        <thead>
          <tr>
            <th>Project name</th>
            <th>Funding</th>
            <th>Start year</th>
            <th>End year</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CLOUD-NET</td>
            <td><a href="https://cordis.europa.eu/project/id/EVK2-CT-2000-00065">EU FP5</a></td>
            <td>2001</td>
            <td>2005</td>
          </tr>
          <tr>
            <td>ACTRIS</td>
            <td><a href="https://cordis.europa.eu/project/id/262254">EU FP7</a></td>
            <td>2011</td>
            <td>2015</td>
          </tr>
          <tr>
            <td>ACTRIS-2</td>
            <td><a href="https://doi.org/10.3030/654109">Horizon 2020</a></td>
            <td>2015</td>
            <td>2019</td>
          </tr>
          <tr>
            <td>ACTRIS-PPP</td>
            <td><a href="https://doi.org/10.3030/739530">Horizon 2020</a></td>
            <td>2017</td>
            <td>2019</td>
          </tr>
          <tr>
            <td><a href="https://envri.eu/the-envri-fair-project/">ENVRI-FAIR</a></td>
            <td><a href="https://doi.org/10.3030/824068">Horizon 2020</a></td>
            <td>2019</td>
            <td>2023</td>
          </tr>
          <tr>
            <td>ACTRIS-IMP</td>
            <td><a href="https://doi.org/10.3030/871115">Horizon 2020</a></td>
            <td>2020</td>
            <td>2023</td>
          </tr>
          <tr>
            <td><a href="https://www.atmo-access.eu/">ATMO-ACCESS</a></td>
            <td><a href="https://doi.org/10.3030/101008004">Horizon 2020</a></td>
            <td>2021</td>
            <td>2025</td>
          </tr>
          <tr>
            <td><a href="https://riurbans.eu/">RI-URBANS</a></td>
            <td><a href="https://doi.org/10.3030/101036245">Horizon 2020</a></td>
            <td>2021</td>
            <td>2025</td>
          </tr>
          <tr>
            <td><a href="https://certainty-aci.eu/">CERTAINTY</a></td>
            <td><a href="https://doi.org/10.3030/101137680">Horizon Europe</a></td>
            <td>2024</td>
            <td>2027</td>
          </tr>
          <tr>
            <td><a href="https://eu-polarin.eu/">POLARIN</a></td>
            <td><a href="https://doi.org/10.3030/101130949">Horizon Europe</a></td>
            <td>2024</td>
            <td>2029</td>
          </tr>
          <tr>
            <td><a href="https://diva.inoe.ro/">DIVA IV</a></td>
            <td><a href="https://www.esa.int/">ESA</a></td>
            <td>2025</td>
            <td>2026</td>
          </tr>
        </tbody>
      </table>
    </main>
  </div>
</template>

<script lang="ts" setup>
import LandingHeader from "@/components/LandingHeader.vue";
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
</style>
