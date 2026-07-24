export const renderShaderCode = /* wgsl */ `
        struct Circle {
            color: vec4f, // 16 bytes
            center: vec2f, // 8 bytes
            velocity: vec2f, // 8 bytes
            radius: f32, // 4 bytes
            grabbed: u32 // 4b ytes
            // pad 8 bytes
        }  // total 48 bytes

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