import { circleStruct } from "./structs.js";
import { global_invocation_index } from "./linear_indexing.js";

export const computeShaderCode = /* wgsl */ `
${global_invocation_index}
${circleStruct.code}

@group(0) @binding(0) var<storage, read_write> circles : array<Circle>; 

// TODO: better workgroup size UPDATE THE GLOBAL INDEX CALC IF CHANGED
@compute @workgroup_size(1) fn applyPhysics(
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_invocation_index: u32,
    @builtin(num_workgroups) num_workgroups: vec3<u32>) {
        let id = global_invocation_index(workgroup_id, local_invocation_index, num_workgroups,
                                         1 /* CHANGE ME WHEN WORKGROUP SIZE CHANGES */);
        if(id > arrayLength(&circles)) {return;}
        circles[id].center += circles[id].velocity;

        let wall = 1.;

        if(circles[id].center.x > wall - circles[id].radius) {
            circles[id].center.x = wall - circles[id].radius;
        }
        if(circles[id].center.x < circles[id].radius-wall) {
            circles[id].center.x = circles[id].radius-wall;
        }
        if(circles[id].center.y > wall - circles[id].radius) {
            circles[id].center.y = wall - circles[id].radius;
        }
        if(circles[id].center.y < circles[id].radius-wall) {
            circles[id].center.y = circles[id].radius-wall;
        }
    }
`;