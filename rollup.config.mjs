import resolve from "@rollup/plugin-node-resolve";
import { shaderCompiler } from "@galacean/engine-shader-compiler/bundler/rollup";
import license from "rollup-plugin-license";
import { binary2base64 } from "rollup-plugin-binary2base64";
import commonjs from "@rollup/plugin-commonjs";
import miniProgramPlugin from "./rollup.miniprogram.plugin.mjs";
import { swc, defineRollupSwcOption, minify } from "rollup-plugin-swc3";
import camelCase from "camelcase";
import fs from "fs";
import path from "path";
import replace from "@rollup/plugin-replace";

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
const rawPkgs = fs
  .readdirSync(pkgsRoot)
  .map((dir) => path.join(pkgsRoot, dir))
  .filter((dir) => fs.statSync(dir).isDirectory())
  .map((location) => {
    return {
      location: location,
      pkgJson: JSON.parse(fs.readFileSync(path.resolve(location, "package.json"), { encoding: "utf-8" }))
    };
  });

// Topological sort by intra-workspace deps so consumers (e.g. auxiliary-lines
// → custom-material) build after their providers. Without this, rollup's
// `Promise.all` over the flattened config array races, and on a cold checkout
// the consumer's bundle fails to resolve the provider's not-yet-emitted
// `dist/es/index.js`.
const pkgs = (() => {
  const byName = new Map(rawPkgs.map((p) => [p.pkgJson.name, p]));
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();
  function visit(p) {
    if (visited.has(p)) return;
    if (visiting.has(p)) return; // skip cycles (shouldn't exist, but safe)
    visiting.add(p);
    const allDeps = { ...(p.pkgJson.dependencies ?? {}), ...(p.pkgJson.peerDependencies ?? {}) };
    for (const dep of Object.keys(allDeps)) {
      const depPkg = byName.get(dep);
      if (depPkg) visit(depPkg);
    }
    visiting.delete(p);
    visited.add(p);
    sorted.push(p);
  }
  rawPkgs.forEach(visit);
  return sorted;
})();

// "@galacean/engine-toolkit" 、 "@galacean/engine-toolkit-controls" ...
function toGlobalName(pkgName) {
  return camelCase(pkgName);
}

const extensions = [".js", ".jsx", ".ts", ".tsx"];
const mainFields = ["module", "main"];

const plugins = [
  resolve({ extensions, preferBuiltins: true, mainFields }),
  // Transform-only — `.shader`/`.glsl`/`.shaderc` files become string/JSON modules.
  // Each package owns its own `precompile` npm script that drives the CLI to
  // emit `.shaderc` artifacts under `<pkg>/libs/`; rollup never runs precompile.
  shaderCompiler(),
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

function generatePkgLicenseHeader(pkgJson) {
  return `@license ${pkgJson.license}\n@package ${pkgJson.name}\n@version ${pkgJson.version}`;
}

function makeRollupConfig(pkg) {
  const externals = Object.keys(
    Object.assign({}, pkg.pkgJson.dependencies, pkg.pkgJson.peerDependencies, pkg.pkgJson.devDependencies)
  );
  let globals = {
    "@galacean/engine": "Galacean",
    "@galacean/engine-xr": "Galacean.XR"
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
        globals: {
          ...globals,
          ...umdConfig.globals
        }
      },
      external: Object.keys(umdConfig.globals ?? {}),
      plugins: [
        ...plugins,
        minify({ sourceMap: true }),
        license({
          banner: {
            content: generatePkgLicenseHeader(pkg.pkgJson)
          }
        })
      ]
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

  // Optional `./sources` subpath entry — emits raw `.shader` strings for editor.
  // Opt-in by checking `exports["./sources"]` in the package's package.json.
  if (pkg.pkgJson.exports?.["./sources"]) {
    const sourcesInput = path.join(pkg.location, "src", "sources.ts");
    configs.push({
      input: sourcesInput,
      output: [
        { file: path.join(pkg.location, "dist", "es", "sources.module.js"), format: "es", sourcemap: true },
        { file: path.join(pkg.location, "dist", "commonjs", "sources.main.js"), format: "commonjs", sourcemap: true }
      ],
      external: externals,
      plugins
    });
  }

  return configs;
}

const builderConfigs = pkgs.map(makeRollupConfig).flat();

builderConfigs.sort((_, b) => {
  if (b.output.format === "umd") return -1;
});

export default Promise.all(builderConfigs);
