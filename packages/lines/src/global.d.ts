declare module "*.wasm";

declare module "*.shader" {
  const value: string;
  export default value;
}

declare module "*.gsp" {
  const value: object;
  export default value;
}
