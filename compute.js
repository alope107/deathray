import { circleStruct } from "./structs.js";

export const computeShaderCode = /* wgsl */ `
${circleStruct.code}

// Need write access to old solely for sorting purposes
@group(0) @binding(0) var<storage, read_write> circlesOld : array<Circle>; 

@compute @workgroup_size(1) fn sortAndDisplay() {
        // insertionSort(0, arrayLength(&circlesOld));
        let startIdx = 0u;
        let endIdx = arrayLength(&circlesOld);

        for(var i = startIdx; i < endIdx-1;) {
            let cand = circlesOld[i];
            circlesOld[i+1] = cand;
        }
}
`;