import { computeShaderCode } from "./compute.js";
import { renderShaderCode } from "./render.js";
import { circleStruct } from "./structs.js";
import { randCircles } from "./random.js";


const main = async () => {
    const device = await (await navigator.gpu?.requestAdapter( {
        powerPreference: "high-performance",
    }))?.requestDevice();

    let renderTarget;
    if(device) {        
        renderTarget = document.body.appendChild(document.createElement("canvas"));
        renderTarget.id = "renderTarget";
    } else {
        let errorMessage = document.body.appendChild(document.createElement("span"));
        errorMessage.innerText = "No WebGPU support :( "
        console.error("No WebGPU support :(");
        return;
    }

    const renderFormat = navigator.gpu.getPreferredCanvasFormat();
    const ctx = renderTarget.getContext("webgpu");
    ctx.configure( {
        device,
        format: renderFormat
    });

    const computeModule = device.createShaderModule({
        label: "compute shader module",
        code:computeShaderCode
    });
    const sortPipeline = device.createComputePipeline({
        label: "sort pipeline",
        layout: "auto",
        compute: {
            module: computeModule,
            entryPoint: "sortAndDisplay"
        }
    });

    const renderModule = device.createShaderModule({
        label: "render module",
        code: renderShaderCode(6)
    });
    const renderPipeline = device.createRenderPipeline({
        label: "render pipeline",
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
        label: "render pass descriptor",
        colorAttachments: [
            {
                clearValue: [0, 0, 0, 1],
                loadOp: "clear",
                storeOp: "store"
            }
        ]
    };

    const circles = randCircles(10, .1, .2);

    const circlePingBuffer = device.createBuffer({
        label: "circlePingBuffer",
        size: circles.data.byteLength,
        usage: GPUBufferUsage.STORAGE |
               GPUBufferUsage.COPY_DST |
               GPUBufferUsage.COPY_SRC | // used for debugging
               GPUBufferUsage.VERTEX
    });

    const sortPingToPongBindGroup = device.createBindGroup({
        label: "sortPingToPongBindGroup",
        layout: sortPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePingBuffer},
        ]
    });

    const renderPingBindGroup = device.createBindGroup({
        label: "renderPingBindGroup",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePingBuffer},
        ]
    });

    device.queue.writeBuffer(circlePingBuffer, 0, circles.data);

    const render = async() => {
        const encoder = device.createCommandEncoder({label: "encoder"});
        let computePass = encoder.beginComputePass();
        computePass.setPipeline(sortPipeline);
        computePass.setBindGroup(0, sortPingToPongBindGroup);
        computePass.dispatchWorkgroups(1); 
        computePass.end();

        renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
        const renderPass = encoder.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(0, renderPingBindGroup);
        renderPass.draw(13, circles.count);
        renderPass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    };

    const animationFrame = async (timestamp) => {
        render();
        requestAnimationFrame(animationFrame);
    };
    requestAnimationFrame(animationFrame);
};

main();