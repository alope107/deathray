import { circleStruct, uniformsStruct } from "./structs.js";
import { global_invocation_index } from "./linear_indexing.js";


export const computeShaderCode = /* wgsl */ `
${global_invocation_index}
${circleStruct.code}
${uniformsStruct.code}

// Need write access to old solely for sorting purposes
@group(0) @binding(0) var<storage, read_write> circlesOld : array<Circle>; 

@compute @workgroup_size(1) fn sortAndDisplay() {
        // insertionSort(0, arrayLength(&circlesOld));
        let startIdx = 0u;
        let endIdx = arrayLength(&circlesOld);

        for(var i = startIdx; i < endIdx;) {
        // we sort the old version because we'll need those old positions
        let cand = circlesOld[i];
        let candLeft = cand.center.y - cand.radius;
        var j = i-1;
        for(; j >= 0; j--) {
        //     let other = circlesOld[j];
        //     let otherLeft = other.center.y - other.radius;
        //     if(candLeft > otherLeft) {
        //         circlesOld[j+1] = other;
        //     } else {
        //         break;
        //     }
        }
        circlesOld[j+1] = cand;
    }
}
`;