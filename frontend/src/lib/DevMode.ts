export class DevMode {

  constructor() {
    this.activated = localStorage.getItem('devmode') ? true : false
  }

  activated: boolean

  enable() {
    console.log('roof')
    localStorage.setItem('devmode', 'yes')
    this.activated = true
  }

  disable() {
    console.log('boof')
    localStorage.removeItem('devmode')
    this.activated = false
  }
}
