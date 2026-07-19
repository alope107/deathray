import { circleStruct } from "./structs.js";

export const randRange =  (min, max) => Math.random() * (max-min) + min; // random in range
export const randClip = () => randRange(-1, 1); // random inside clip bound
export const randColor = () => [Math.random(), Math.random(), Math.random(), 1.];
export const randCircles = (circleCount, minRadius, maxRadius) => {
    let circles = [];
    for(let i = 0; i < circleCount; i++) {
        circles.push({
            center: [randClip(), randClip()],
            color: randColor(),
            velocity: [0,0],
            radius: randRange(minRadius, maxRadius)
        });
    }

    return circleStruct.createFilledArray(circles);
}