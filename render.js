import { circleStruct } from "./structs.js";
export const renderShaderCode = (polysPerCircle) => /* wgsl */ `
${circleStruct.code}

@group(0) @binding(0) var<storage, read> circles : array<Circle>; 

@vertex fn triangle(@builtin(vertex_index) vertexIdx : u32, 
                    @builtin(instance_index) instanceIdx : u32) -> @builtin(position) vec4f {
    let circle = circles[instanceIdx];

    return vec4f(circle.center, 0, 1);
}

@fragment fn solidColor(@builtin(position) pos : vec4f) -> @location(0) vec4f {
    return vec4f(1, 0, 0, 1);
}
`;