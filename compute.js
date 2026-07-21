import { circleStruct } from "./structs.js";

export const computeShaderCode = /* wgsl */ `
${circleStruct.code}

// Need write access to old solely for sorting purposes
@group(0) @binding(0) var<storage, read_write> circlesOld : array<Circle>; 

@compute @workgroup_size(1) fn sortAndDisplay() {
        for(var i = 0u; i < 1;) {
            circlesOld[i+1] = circlesOld[i];
        }
}
`;