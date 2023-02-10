export class ActiveConsent {
  // EDIT THE FOLLOWING LINE WHEN CHANGING PRIVACY POLICY
  privacyPolicyEdited = "2020-12-18";
  // LEAVE THE REST OF THE LINES IN THIS FILE ALONE

  askConsent: boolean;

  constructor() {
    const lastConsent = parseInt(localStorage.getItem("consented") || "0");
    this.askConsent =
      lastConsent < new Date(this.privacyPolicyEdited).getTime() / 1000;
  }

  consent() {
    const lastConsent = Math.floor(Date.now() / 1000);
    localStorage.setItem("consented", `${lastConsent}`);
    this.askConsent = false;
  }
}
