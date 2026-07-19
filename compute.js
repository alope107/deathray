import { circleStruct, uniformsStruct } from "./structs.js";
import { global_invocation_index } from "./linear_indexing.js";

export const computeShaderCode = /* wgsl */ `
${global_invocation_index}
${circleStruct.code}
${uniformsStruct.code}

@group(0) @binding(0) var<storage, read> circlesOld : array<Circle>; 
@group(0) @binding(1) var<storage, read_write> circlesNew : array<Circle>;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;

// TODO: better workgroup size UPDATE THE GLOBAL INDEX CALC IF CHANGED
@compute @workgroup_size(1) fn applyPhysics(
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_invocation_index: u32,
    @builtin(num_workgroups) num_workgroups: vec3<u32>) {
        let id = global_invocation_index(workgroup_id, local_invocation_index, num_workgroups,
                                         1 /* CHANGE ME WHEN WORKGROUP SIZE CHANGES */);
        if(id > arrayLength(&circlesOld)) {return;}

        circlesNew[id].grabbed = select(0u, 1u, 
                                       (uniforms.pointerHeld > 0 && circlesOld[id].grabbed>0) // grabbed if previously grabbed and not yet released
                                       || (uniforms.pointerPressed > 0&& length(circlesOld[id].center - uniforms.pointerLoc) < circlesOld[id].radius)); // grabbed if pressed on this frame

        let gravity = select(uniforms.gravity, vec2f(), circlesNew[id].grabbed > 0);// no gravity if grabbed
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
                circlesNew[id].center += (delta * (diff/dist)) / 2;
                circlesNew[id].velocity += (delta * (diff/dist)) / 2;
            }
        }

        let pointerDelta = select(vec2f(), uniforms.pointerLoc - circlesNew[id].center, circlesNew[id].grabbed > 0);
        circlesNew[id].velocity += pointerDelta;
        circlesNew[id].center += pointerDelta;

        // Treat walls the same way we treat the other circles?
        let wall = 1.;
        let fakes = array(
            vec2f(circlesNew[id].center.x, 1),
            vec2f(circlesNew[id].center.x, -1),
            vec2f(1, circlesNew[id].center.y),
            vec2f(-1, circlesNew[id].center.y)
        );
        for(var i = 0u; i < 4; i++) {
            let delta = circlesNew[id].center - fakes[i];
            let dist = length(delta);
            // TODO: branchless
            let contactDist = circlesNew[id].radius;
            let diff = contactDist - dist;
            if(diff > 0) {
                // TODO: uneven movement
                circlesNew[id].center += (delta * (diff/dist));
                circlesNew[id].velocity += (delta * (diff/dist));
            }
        }
    }
`;