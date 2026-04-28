declare module "*.wasm";

declare module "*.shader" {
  const value: string;
  export default value;
}
