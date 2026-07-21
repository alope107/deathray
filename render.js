import { circleStruct } from "./structs.js";
export const renderShaderCode = (polysPerCircle) => /* wgsl */ `
${circleStruct.code}

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(0) color : vec4f
}

@group(0) @binding(0) var<storage, read> circles : array<Circle>; 

@vertex fn triangle(@builtin(vertex_index) vertexIdx : u32, 
                    @builtin(instance_index) instanceIdx : u32) -> VertexOutput {
    let circle = circles[instanceIdx];

    return VertexOutput(
        vec4f(circle.center, 0, 1.),
        circle.color
    );
}

@fragment fn solidColor(fragInput : VertexOutput) -> @location(0) vec4f {
    return fragInput.color;
}
`;