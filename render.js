export const renderShaderCode = /* wgsl */ `
@vertex fn triangle(
    @builtin(vertex_index) vertexIdx : u32) -> @builtin(position) vec4f {
    let points = array(
        vec2f(0, 0),
        vec2f(0, .1),
        vec2f(.1, .1),
        vec2f(.1, 0)
    );

    return vec4f(points[vertexIdx], 0, 1.);
}

@fragment fn solidColor(@builtin(position) position : vec4f) -> @location(0) vec4f {
    return vec4(1, 0, 0, 1);
}
`;