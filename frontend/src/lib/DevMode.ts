export class DevMode {
  constructor() {
    this.activated = !!localStorage.getItem("devmode");
  }

  activated: boolean;

  enable() {
    localStorage.setItem("devmode", "yes");
    this.activated = true;
  }

  disable() {
    localStorage.removeItem("devmode");
    this.activated = false;
  }
}
