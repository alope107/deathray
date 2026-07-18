import { circleStruct } from "./structs.js";
import { global_invocation_index } from "./linear_indexing.js";

export const computeShaderCode = /* wgsl */ `
${global_invocation_index}
${circleStruct.code}

@group(0) @binding(0) var<storage, read> circlesOld : array<Circle>; 
@group(0) @binding(1) var<storage, read_write> circlesNew : array<Circle>; 

// TODO: better workgroup size UPDATE THE GLOBAL INDEX CALC IF CHANGED
@compute @workgroup_size(1) fn applyPhysics(
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_invocation_index: u32,
    @builtin(num_workgroups) num_workgroups: vec3<u32>) {
        let id = global_invocation_index(workgroup_id, local_invocation_index, num_workgroups,
                                         1 /* CHANGE ME WHEN WORKGROUP SIZE CHANGES */);
        if(id > arrayLength(&circlesOld)) {return;}

        let gravity = vec2f(0, -.0001);
        circlesNew[id].velocity = circlesOld[id].velocity + gravity;
        circlesNew[id].center = circlesOld[id].center + circlesNew[id].velocity;

        // Todo: bucketing, momentum?
        for(var i = 0u; i < arrayLength(&circlesOld); i++) {
            if(i == id) {continue;}
            let delta = circlesNew[id].center - circlesOld[i].center;
            let dist = length(delta);
            // TODO: branchless
            let contactDist = circlesNew[id].radius + circlesOld[i].radius;
            let diff = contactDist - dist;
            if(diff > 0) {
                // TODO: uneven movement
                circlesNew[id].center += (delta * (diff/contactDist)) / 2.;
            }
        }

        let wall = 1.;
        

        if(circlesNew[id].center.x > wall - circlesNew[id].radius) {
            circlesNew[id].center.x = wall - circlesNew[id].radius;
        }
        if(circlesNew[id].center.x < circlesNew[id].radius-wall) {
            circlesNew[id].center.x = circlesNew[id].radius-wall;
        }
        if(circlesNew[id].center.y > wall - circlesNew[id].radius) {
            circlesNew[id].center.y = wall - circlesNew[id].radius;
        }
        if(circlesNew[id].center.y < circlesNew[id].radius-wall) {
            circlesNew[id].center.y = circlesNew[id].radius-wall;
        }
    }
`;