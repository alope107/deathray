export const renderShaderCode = /* wgsl */ `
const PI = radians(180.0);

@vertex fn triangle(
    @builtin(vertex_index) vertexIdx : u32) -> @builtin(position) vec4f {
    // let points = array(
    //     vec2f(0, 0),
    //     vec2f(0, .1),
    //     vec2f(.1, .1),
    //     vec2f(.1, 0)
    // );

    let center = vec2f(0, 0);
    let r = select(0., .3, (vertexIdx & 1) == 0);
    let segments = 10.;
    let angle = 2 * PI * f32(vertexIdx) / (2*segments);

    // TODO precompute matrix

    return vec4f(center + (r * vec2f(cos(angle), sin(angle))), 0, 1.);
}

@fragment fn solidColor(@builtin(position) position : vec4f) -> @location(0) vec4f {
    return vec4(1, 0, 0, 1);
}
`;