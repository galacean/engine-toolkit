import { Shader } from "@galacean/engine";

import shaderSource from "./Dash.shader";

Shader.find("dash") || Shader.create(shaderSource);
