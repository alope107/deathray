export const computeShaderCode = /* wgsl */ `
struct Circle {
    color: vec4f, // 16 bytes
    center: vec2f, // 8 bytes
    velocity: vec2f, // 8 bytes
    radius: f32, // 4 bytes
    grabbed: u32 // 4b ytes
    // pad 8 bytes
}  // total 48 bytes

@group(0) @binding(0) var<storage, read_write> circlesOld : array<Circle>; 

@compute @workgroup_size(1) fn sortAndDisplay() {
        for(var i = 0u; i < 1;) {
            circlesOld[i+1] = circlesOld[i];
        }
}
`;