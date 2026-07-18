// Want to recompute layouts?
// Go here! https://webgpufundamentals.org/webgpu/lessons/resources/wgsl-offset-computer.html

export const circleStruct = (() => { 
    const code = /* wgsl */`
        struct Circle {
            color: vec4f, // 16 bytes
            center: vec2f, // 8 bytes
            velocity: vec2f, // 8 bytes
            radius: f32, // 4 bytes
            // pad 12 bytes
        }  // total 48 bytes
    `
    const byteCount = 48;
    const floatCount = byteCount / 4;
    const createEmptyArray = (circleCount) => {
        const data = new ArrayBuffer(byteCount * circleCount);
        return {
            data,
            views: {
                colorView: new Float32Array(data, 0),
                centerView: new Float32Array(data, 16),
                velocityView: new Float32Array(data, 24),
                radiusView: new Float32Array(data, 32),
            },
            count: circleCount
        };
    };
    const createFilledArray = (circleData) => {
        const data = createEmptyArray(circleData.length);
        const {colorView, centerView, velocityView, radiusView} = data.views;
        circleData.forEach(({color, center, velocity, radius}, i) => {
            colorView.set(color, i*floatCount);
            centerView.set(center, i*floatCount);
            velocityView.set(velocity, i*floatCount);
            radiusView.set([radius], i*floatCount);
        });
        return data;
    };
    return {
        code,
        byteCount,
        floatCount,
        createEmptyArray,
        createFilledArray
    };
})();

export const uniformsStruct = (() => { 
    const code = /* wgsl */ `
        struct Uniforms {
            gravity: vec2f,  //8 bytes
            pointerLoc: vec2f, // 8 bytes, location of pointer
            pointerPressed: u32, // 4 bytes, was the pointer first pressed this frame?
            pointerHeld: u32 // 4 bytes, is the pointer currently held down?
        } // total 24 bytes
`;
    const byteCount = 24;
    const u32Count = byteCount/4;
    const floatCount = byteCount/4;
    const createEmpty = () => {
        const data = new ArrayBuffer(byteCount);
        return {
            data,
            views: {
                gravityView: new Float32Array(data, 0),
                pointerLocView: new Float32Array(data, 8),
                pointerPressedView: new Uint32Array(data, 16),
                pointerHeldView: new Uint32Array(data, 20),
            },
            count: 1
        };
    };
    return {
        code,
        byteCount,
        u32Count,
        floatCount,
        createEmpty,
        createFilled: ({gravity, pointerLoc, pointerPressed, pointerHeld}) => {
            const uniform = createEmpty();
            uniform.views.gravityView.set(gravity, 0);
            uniform.views.pointerLocView.set(pointerLoc, 0);
            uniform.views.pointerPressedView.set([pointerPressed], 0);
            uniform.views.pointerHeldView.set([pointerHeld], 0);
            return uniform;
        }
    };
})();