import { computeShaderCode } from "./compute.js";
import { renderShaderCode } from "./render.js";


const main = async () => {
    const device = await (await navigator.gpu?.requestAdapter( {
        powerPreference: "high-performance",
    }))?.requestDevice();
    
    let renderTarget = document.body.appendChild(document.createElement("canvas"));
    renderTarget.id = "renderTarget";

    const dataSize = 48*10;

    const renderFormat = navigator.gpu.getPreferredCanvasFormat();
    const ctx = renderTarget.getContext("webgpu");
    ctx.configure( {
        device,
        format: renderFormat
    });

    const computeModule = device.createShaderModule({
        code:computeShaderCode
    });
    const sortPipeline = device.createComputePipeline({
        layout: "auto",
        compute: {
            module: computeModule,
            entryPoint: "sortAndDisplay"
        }
    });

    const renderModule = device.createShaderModule({
        code: renderShaderCode
    });
    const renderPipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            entryPoint: "triangle",
            module: renderModule
        },
        fragment:{
            entryPoint: "solidColor",
            module: renderModule,
            targets: [{format: renderFormat}]
        },
        primitive: {
            topology: "triangle-strip"
        }
    });
    const renderPassDescriptor = {
        colorAttachments: [
            {
                // clearValue: [0, 0, 0, 1],
                loadOp: "clear",
                storeOp: "store"
            }
        ]
    };

    const buffer = device.createBuffer({
        size: dataSize,
        usage: GPUBufferUsage.STORAGE |
               GPUBufferUsage.COPY_DST |
               GPUBufferUsage.COPY_SRC | // used for debugging
               GPUBufferUsage.VERTEX
    });

    const computeBindGroup = device.createBindGroup({
        layout: sortPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: buffer},
        ]
    });

    const renderBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: buffer},
        ]
    });

    device.queue.writeBuffer(buffer, 0, new ArrayBuffer(dataSize));

    const encoder = device.createCommandEncoder({label: "encoder"});
    let computePass = encoder.beginComputePass();
    computePass.setPipeline(sortPipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(1); 
    computePass.end();

    renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    const renderPass = encoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(13, 20);
    renderPass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
};

main();