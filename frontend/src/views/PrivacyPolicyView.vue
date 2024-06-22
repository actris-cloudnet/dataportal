<template>
  <div>
    <LandingHeader title="Privacy policy" />
    <main class="pagewidth">
      <h3>Scope</h3>
      <p>
        This policy describes how we, ACTRIS Cloud remote sensing data centre unit (later CLU) at the Finnish
        Meteorological Institute (later FMI), use your personal data when you visit the ACTRIS Cloudnet website
        cloudnet.fmi.fi (later Cloudnet data portal).
      </p>
      <h3>Who is responsible for my data?</h3>
      <p>
        The CLU unit at FMI is the data controller. That means we are responsible for collecting your data and looking
        after it.
      </p>
      <h3>What data is used?</h3>
      <p>
        Your IP address is recorded when you are using the Cloudnet data portal. We use IP addresses to extract metrics
        of site use, such as which country our users connect from, and how many unique users have downloaded data files.
        Processing is based on our interest in Cloudnet data spread, and in the need to prevent the malicious use of the
        site (e.g. denial of service attacks).
      </p>
      <h3>Who gets my data?</h3>
      <p>
        Personal data will be used for the purpose it was first collected for. We won’t transfer your personal
        information outside of Cloudnet data portal.
      </p>
      <h3>Data security</h3>
      <p>
        The Cloudnet data portal uses SSL encryption. The Cloudnet data portal servers are only accessible for admins
        from the FMI’s internal network. The servers are physically located in Finland.
      </p>
      <h3>What rights do I have?</h3>
      <h4>Unconditional rights by law</h4>
      <ul>
        <li>
          Access to the personal data. You have the right to a copy of your processed data, so you can check the data
          itself.
        </li>
        <li>Rectification. You have the right to have incorrect data corrected.</li>
        <li>
          Complaint. You have the right to lodge a complaint with your national supervisory authority. In Finland you
          can contact the Finnish Data Protection Ombudsman:
          <a href="https://tietosuoja.fi/en/contact-information">https://tietosuoja.fi/en/contact-information</a>.
        </li>
        <li>
          Object to processing. You have the right to object to the processing. The processing stops until we
          demonstrate compelling legitimate grounds for the processing. A document assessing our legitimate interests
          and their relationship with you will be provided to you.
        </li>
      </ul>
      <h4>Conditional rights</h4>
      <p>These rights apply if certain conditions are met.</p>
      <ul>
        <li>
          Erasure. You might have the right to have your data removed from our storage, for example when you withdraw
          consent for processing.
        </li>
        <li>
          Restriction of processing. You might have the right to have us restrict the processing of your data, for
          example when we don’t need the data anymore, but you require it for a legal claim.
        </li>
        <li>
          Portability. You have the right to have your data transmitted to another controller without hindrance from
          Cloudnet when the processing is based on your consent or a contract between you and us.
        </li>
      </ul>
      <h3>Exercising your rights</h3>
      <p>
        If you have a question regarding our privacy policy, wish to exercise any of your rights, or feel
        dissatisfaction with our use of your data, please contact the Cloudnet team by sending an email to
        <a href="mailto:actris-cloudnet@fmi.fi">actris-cloudnet@fmi.fi</a>. We will perform our duties without undue
        delay within one month of your request. That period may be extended by two further months where necessary,
        considering the complexity and number of the requests. For further information about your rights and exercising
        them, please see here
        <a href="https://tietosuoja.fi/en/know-your-rights">https://tietosuoja.fi/en/know-your-rights</a>.
      </p>
      <h3>Changes to this policy</h3>
      <p>We will inform you of any material changes to this policy with a notice on our website.</p>
      <!-- REMEMBER TO CHANGE LAST UPDATED DATE WHEN MAKING MODIFICATIONS TO THIS PAGE. SEE @/lib/ActiveConsent.ts -->
      <p>
        This policy has been last updated in <b>{{ lastEdited }}</b
        >.
      </p>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ActiveConsent } from "@/lib/ActiveConsent";
import LandingHeader from "@/components/LandingHeader.vue";

const lastEdited = new ActiveConsent().privacyPolicyEdited;
</script>

<style scoped lang="scss">
main {
  padding-bottom: 1rem;
}

h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-size: 1.2rem;
}

h4 {
  font-weight: 600;
  margin-top: 1em;
  font-size: 1.1rem;
}

p + p {
  margin-top: 0.5rem;
}

ul {
  list-style: disc;
  padding-left: 2rem;
}
</style>
