// Want to recompute layouts?
// Go here! https://webgpufundamentals.org/webgpu/lessons/resources/wgsl-offset-computer.html

export const circleStruct = (() => { 
    const code = /* wgsl */`
        struct Circle {
            color: vec4f, // 16 bytes
            center: vec2f, // 8 bytes
            radius: f32, // 4 bytes
            // pad 4 bytes
        }  // total 32 bytes
    `
    const byteCount = 32;
    const floatCount = byteCount / 4;
    const createEmptyArray = (circleCount) => {
        const data = new ArrayBuffer(byteCount * circleCount);
        return {
            data,
            views: {
                colorView: new Float32Array(data, 0),
                centerView: new Float32Array(data, 16),
                radiusView: new Float32Array(data, 24),
            },
            count: circleCount
        };
    };
    const createFilledArray = (circleData) => {
        const data = createEmptyArray(circleData.length);
        const {colorView, centerView, radiusView} = data.views;
        circleData.forEach(({color, center, radius}, i) => {
            colorView.set(color, i*floatCount);
            centerView.set(center, i*floatCount);
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