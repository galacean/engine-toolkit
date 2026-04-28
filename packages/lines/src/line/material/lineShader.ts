import { Shader } from "@galacean/engine";

import shaderSource from "./Line.shader";

Shader.find("line") || Shader.create(shaderSource);
