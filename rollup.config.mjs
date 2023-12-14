import resolve from "@rollup/plugin-node-resolve";
import glslify from "rollup-plugin-glslify";
import { binary2base64 } from "rollup-plugin-binary2base64";
import commonjs from "@rollup/plugin-commonjs";
import miniProgramPlugin from "./rollup.miniprogram.plugin.mjs";
import { swc, defineRollupSwcOption, minify } from "rollup-plugin-swc3";
import camelCase from "camelcase";
import fs from "fs";
import path from "path";
import replace from "@rollup/plugin-replace";
import { string } from "rollup-plugin-string";

function walk(dir) {
  let files = fs.readdirSync(dir);
  files = files.map((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) return walk(filePath);
    else if (stats.isFile()) return filePath;
  });
  return files.reduce((all, folderContents) => all.concat(folderContents), []);
}

const pkgsRoot = path.join(process.cwd(), "packages");
const pkgs = fs
  .readdirSync(pkgsRoot)
  .map((dir) => path.join(pkgsRoot, dir))
  .filter((dir) => fs.statSync(dir).isDirectory())
  .map((location) => {
    return {
      location: location,
      pkgJson: JSON.parse(fs.readFileSync(path.resolve(location, "package.json"), { encoding: "utf-8" }))
    };
  });

// "@galacean/engine-toolkit" 、 "@galacean/engine-toolkit-controls" ...
function toGlobalName(pkgName) {
  return camelCase(pkgName);
}

const extensions = [".js", ".jsx", ".ts", ".tsx"];
const mainFields = ["module", "main"];

const plugins = [
  resolve({ extensions, preferBuiltins: true, mainFields }),
  glslify({
    include: [/\.glsl$/]
  }),
  string({ include: "**/*.shader" }),
  swc(
    defineRollupSwcOption({
      include: /\.[mc]?[jt]sx?$/,
      exclude: /node_modules/,
      jsc: {
        loose: true,
        externalHelpers: true,
        target: "es5"
      },
      sourceMaps: true
    })
  ),
  binary2base64({
    include: ["**/*.wasm"]
  }),
  commonjs()
];

function makeRollupConfig(pkg) {
  const externals = Object.keys(
    Object.assign({}, pkg.pkgJson.dependencies, pkg.pkgJson.peerDependencies, pkg.pkgJson.devDependencies)
  );
  let globals = {
    "@galacean/engine": "Galacean"
  };
  externals.forEach((external) => {
    globals[external] = toGlobalName(external);
  });

  const entries = Object.fromEntries(
    walk(path.join(pkg.location, "src"))
      .filter((file) => /^(?!.*\.d\.ts$).*\.ts$/.test(file))
      .map((item) => {
        return [path.relative(path.join(pkg.location, "src"), item.replace(/\.[^/.]+$/, "")), item];
      })
  );

  plugins.push(
    replace({
      preventAssignment: true,
      __buildVersion: pkg.pkgJson.version
    })
  );

  const umdConfig = pkg.pkgJson.umd;

  const configs = [
    {
      input: entries,
      output: {
        dir: path.join(pkg.location, "dist", "es"),
        format: "es",
        sourcemap: true,
        globals: globals
      },
      external: externals,
      plugins
    }
  ];

  configs.push({
    input: path.join(pkg.location, "src", "index.ts"),
    output: {
      file: path.join(pkg.location, pkg.pkgJson.main),
      sourcemap: true,
      format: "commonjs"
    },
    external: externals,
    plugins
  });

  if (umdConfig) {
    configs.push({
      input: path.join(pkg.location, "src", "index.ts"),
      output: {
        file: path.join(pkg.location, "dist", "umd", "browser.js"),
        format: "umd",
        name: umdConfig.name,
        globals: globals
      },
      external: Object.keys(umdConfig.globals ?? {}),
      plugins: [...plugins, minify({ sourceMap: true })]
    });
  }

  configs.push({
    input: path.join(pkg.location, "src", "index.ts"),
    output: {
      file: path.join(pkg.location, "dist", "miniprogram.js"),
      sourcemap: false,
      format: "cjs"
    },
    external: Object.keys(Object.assign(pkg.pkgJson.dependencies ?? {}, pkg.pkgJson.peerDependencies ?? {}))
      .concat("@galacean/engine-miniprogram-adapter")
      .map((name) => `${name}/dist/miniprogram`),
    plugins: [...plugins, ...miniProgramPlugin]
  });

  return configs;
}

export default Promise.all(pkgs.map(makeRollupConfig).flat());
