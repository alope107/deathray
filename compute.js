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

        var newMe = circlesNew[id]; // does this slow down making a copy?
        let oldMe = circlesOld[id];
        newMe.grabbed = select(0u, 1u, 
                                       (uniforms.pointerHeld > 0 && oldMe.grabbed>0) // grabbed if previously grabbed and not yet released
                                       || (uniforms.pointerPressed > 0&& length(oldMe.center - uniforms.pointerLoc) < oldMe.radius)); // grabbed if pressed on this frame

        let gravity = select(uniforms.gravity, vec2f(), newMe.grabbed > 0);// no gravity if grabbed
        newMe.velocity = oldMe.velocity + gravity;
        newMe.center = oldMe.center + newMe.velocity;

        // Todo: bucketing, momentum?
        for(var i = 0u; i < arrayLength(&circlesOld); i++) {
            if(i == id) {continue;}
            let delta = newMe.center - circlesOld[i].center;
            let dist = length(delta);
            // TODO: branchless
            let contactDist = newMe.radius + circlesOld[i].radius;
            let diff = contactDist - dist;
            if(diff > 0) {
                // TODO: uneven movement
                newMe.center += (delta * (diff/dist)) / 2;
                newMe.velocity += (delta * (diff/dist)) / 2;
            }
        }

        let pointerDelta = select(vec2f(), uniforms.pointerLoc - newMe.center, newMe.grabbed > 0);
        newMe.velocity += pointerDelta;
        newMe.center += pointerDelta;


        // TODO: move to uniforms
        let wall = 1.;
        let restitution = .3;

        let r = newMe.radius;
        let c = newMe.center;
        // TODO: branchless?
        if(c.x > wall - r) {
            newMe.center.x = wall - r;
            newMe.velocity.x *= -restitution;
        }
        if(c.x < -wall + r) {
            newMe.center.x = -wall + r;
            newMe.velocity.x *= -restitution;
        }
        if(c.y > wall - r) {
            newMe.center.y = wall - r;
            newMe.velocity.y *= -restitution;
        }
        if(c.y < -wall + r) {
            newMe.center.y = -wall + r;
            newMe.velocity.y *= -restitution;
        }
        circlesNew[id] = newMe;
    }
`;