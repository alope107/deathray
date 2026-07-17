import { circleStruct } from "./structs.js";
export const renderShaderCode = (polysPerCircle) => /* wgsl */ `
${circleStruct.code}

const PI = radians(180.0);

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(0) color : vec4f
}

@group(0) @binding(0) var<storage, read> circles : array<Circle>; 

@vertex fn triangle(@builtin(vertex_index) vertexIdx : u32, 
                    @builtin(instance_index) instanceIdx : u32) -> VertexOutput {
    let circle = circles[instanceIdx];
    let r = select(0., circle.radius, (vertexIdx & 1) == 0); // Alternate between edges and center
    let segments = ${polysPerCircle}.;

    // TODO precompute matrix
    let angle = 2 * PI * f32(vertexIdx) / (2*segments);

    return VertexOutput(
        vec4f(circle.center + (r * vec2f(cos(angle), sin(angle))), 0, 1.),
        select(vec4(), circle.color, (vertexIdx & 1) == 0)
    );
}

@fragment fn solidColor(fragInput : VertexOutput) -> @location(0) vec4f {
    return fragInput.color;
}
`;