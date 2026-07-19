const main = async () => {
    const device = await (await navigator.gpu?.requestAdapter( {
        powerPreference: "high-performance",
    }))?.requestDevice();

    let renderTarget = document.getElementById("renderTarget");

    const renderFormat = navigator.gpu.getPreferredCanvasFormat();
    const ctx = renderTarget.getContext("webgpu");
    ctx.configure( {
        device,
        format: renderFormat
    });

    const computeModule = device.createShaderModule({
        label: "compute shader module",
        code: /* wgsl */ `
        @compute @workgroup_size(1)fn deathray() {
            for(var i = 0u; i >= 0; i++){}
        }
        `
    });
    const deathrayPipeline = device.createComputePipeline({
        label: "deathray pipeline",
        layout: "auto",
        compute: {
            module: computeModule,
            entryPoint: "deathray"
        }
    });

    const encoder = device.createCommandEncoder({label: "encoder"});
    let computePass = encoder.beginComputePass();
    computePass.setPipeline(deathrayPipeline);
    computePass.dispatchWorkgroups(1);
    computePass.end();
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
};
main();