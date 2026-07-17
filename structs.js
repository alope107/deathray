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