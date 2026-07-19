// Polyfill to work around lack of full linear indexing support under webkit

// Adapted from https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html
export const global_invocation_index = /* wgsl */ `
fn global_invocation_index (workgroup_id : vec3<u32>,
                            local_invocation_index: u32,
                            num_workgroups: vec3<u32>,
                            threadsPerWorkgroup : u32,
) -> u32 {
    let workgroup_index =  
        workgroup_id.x +
        workgroup_id.y * num_workgroups.x +
        workgroup_id.z * num_workgroups.x * num_workgroups.y;

    return
        workgroup_index * threadsPerWorkgroup +
        local_invocation_index;
}
`;