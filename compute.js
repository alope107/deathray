import { circleStruct, uniformsStruct } from "./structs.js";
import { global_invocation_index } from "./linear_indexing.js";
import { insertionSort } from "./sort.js";


export const computeShaderCode = /* wgsl */ `
${global_invocation_index}
${insertionSort}
${circleStruct.code}
${uniformsStruct.code}

// Need write access to old solely for sorting purposes
@group(0) @binding(0) var<storage, read_write> circlesOld : array<Circle>; 

@compute @workgroup_size(1) fn sortAndDisplay(@builtin(workgroup_id) workgroup_id : vec3<u32>,
                                              @builtin(local_invocation_index) local_invocation_index: u32,
                                              @builtin(num_workgroups) num_workgroups: vec3<u32>) {
        let id = global_invocation_index(workgroup_id, local_invocation_index, num_workgroups,
                                         1 /* CHANGE ME WHEN WORKGROUP SIZE CHANGES */);
        if(id > 0) {return;}

        insertionSort(0, arrayLength(&circlesOld));
}
`;