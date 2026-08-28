/// <reference types="vite/client" />

declare module "vue-matomo";

declare module "*.yaml" {
  const content: any;
  export default content;
}
