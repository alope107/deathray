import { circleStruct } from "./structs.js";
export const renderShaderCode = (polysPerCircle) => /* wgsl */ `
${circleStruct.code}

const PI = radians(180.0);

@group(0) @binding(0) var<storage, read> circles : array<Circle>; 

@vertex fn triangle(@builtin(vertex_index) vertexIdx : u32, 
                    @builtin(instance_index) instanceIdx : u32) -> @builtin(position) vec4f {
    let circle = circles[instanceIdx];
    let r = select(0., circle.radius, (vertexIdx & 1) == 0); // Alternate between edges and center
    let segments = ${polysPerCircle}.;

    // TODO precompute matrix
    let angle = 2 * PI * f32(vertexIdx) / (2*segments);

    return vec4f(circle.center + (r * vec2f(cos(angle), sin(angle))), 0, 1.);
}

@fragment fn solidColor(@builtin(position) position : vec4f) -> @location(0) vec4f {
    return vec4(1, 0, 0, 1);
}
`;