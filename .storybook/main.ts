

import { join, dirname } from "path";
import { string } from "rollup-plugin-string";

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')))
}

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials")
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/html-vite'),
    "options": {}
  },
  "core": {
    "disableTelemetry": true
  },
  "viteFinal": async (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(
      string({
        include: ['**/*.glsl', '**/*.shader', '**/*.vs.glsl', '**/*.fs.glsl']
      })
    );
    
    return config;
  }
};

export default config;
