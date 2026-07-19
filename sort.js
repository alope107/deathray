export const insertionSort = /* wgsl */ `

// Start with naive, non parallelized sort
// Want to optimize later!
// Or honestly might be good enough idk
// Going to hardcode working with circles for now, but I think with a
// size and offset passed in you could do any arbitrary structs?
// Also! Pass in point to array instead of hardcoding array
fn insertionSort(startIdx : u32, // inclusive
                          endIdx : u32) { //exclusive
    for(var i = startIdx; i < endIdx;) {
        // we sort the old version because we'll need those old positions
        let cand = circlesOld[i];
        let candLeft = cand.center.y - cand.radius;
        var j = i+1;
        for(; j < endIdx; j++) {
            let other = circlesOld[j];
            let otherLeft = other.center.y - other.radius;
            if(candLeft > otherLeft) {
                circlesOld[j-1] = other;
            } else {
                break;
            }
        }
        if(j - 1 == i) {
            i++;
        } else {
            i = 0;
            circlesOld[j-1] = cand;
        }
    }
}`