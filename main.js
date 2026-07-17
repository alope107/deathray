import { computeShaderCode } from "./compute.js";
import { renderShaderCode } from "./render.js";
import { startResizeObservation } from "./resize.js";
import { circleStruct } from "./structs.js";

const POLYS_PER_CIRCLE = 30;

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

    startResizeObservation(renderTarget, device.limits.maxTextureDimension2D);

    // These errors are automatically surfaced in the chrome terminal,
    // but need to be explicitly listened for on webkit
    device.addEventListener("uncapturederror", (e) => {
        console.error("Uncaptured error: ", e.error.message);
    });

    const renderFormat = navigator.gpu.getPreferredCanvasFormat();
    const ctx = renderTarget.getContext("webgpu");
    ctx.configure( {
        device,
        format: renderFormat
    });

    const computeModule = device.createShaderModule({
        label: "compute shader module",
        code:computeShaderCode
    })
    const physicsPipeline = device.createComputePipeline({
        label: "physics pipeline",
        layout: "auto",
        compute: {
            module: computeModule,
            entryPoint: "applyPhysics"
        }
    });

    const renderModule = device.createShaderModule({
        label: "render module",
        code: renderShaderCode(POLYS_PER_CIRCLE)
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

    const circles = circleStruct.createFilledArray([
        {
            color: [0., .98, 0., 1.],
            center: [.3, .6],
            velocity: [-.005, -.01],
            radius: .15
        },
        {
            color: [.99, 0., 0., 1.],
            center: [0, 0],
            velocity: [.01, -.003],
            radius: .15
        }

    ])

    const circlePingBuffer = device.createBuffer({
        label: "circlePingBuffer",
        size: circles.data.byteLength,
        usage: GPUBufferUsage.STORAGE |
               GPUBufferUsage.COPY_DST |
            //    GPUBufferUsage.COPY_SRC | // used for debugging
               GPUBufferUsage.VERTEX
    });
    const circlePongBuffer = device.createBuffer({
        label: "circlePongBuffer",
        size: circles.data.byteLength,
        usage: GPUBufferUsage.STORAGE |
               GPUBufferUsage.COPY_DST |
            //    GPUBufferUsage.COPY_SRC | // used for debugging
               GPUBufferUsage.VERTEX
    });

    const physicsPingToPongBindGroup = device.createBindGroup({
        label: "physicsPingToPongBindGroup",
        layout: physicsPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePingBuffer},
            {binding: 1, resource: circlePongBuffer},
        ]
    });
    const physicsPongToPingBindGroup = device.createBindGroup({
        label: "physicsPongToPingBindGroup",
        layout: physicsPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePongBuffer},
            {binding: 1, resource: circlePingBuffer},
        ]
    });

    const renderPingBindGroup = device.createBindGroup({
        label: "renderPingBindGroup",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePingBuffer},
        ]
    });
    const renderPongBindGroup = device.createBindGroup({
        label: "renderPongBindGroup",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePongBuffer},
        ]
    });

    device.queue.writeBuffer(circlePingBuffer, 0, circles.data);
    device.queue.writeBuffer(circlePongBuffer, 0, circles.data);


    let frameCount = 0;
    const render = async() => {
        const encoder = device.createCommandEncoder({label: "encoder"});

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(physicsPipeline);
        computePass.setBindGroup(0, frameCount % 2 == 0 ? physicsPingToPongBindGroup: physicsPongToPingBindGroup);
        computePass.dispatchWorkgroups(circles.count);
        computePass.end();
        

        renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
        const renderPass = encoder.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(0, frameCount % 2 == 0 ? renderPongBindGroup : renderPingBindGroup);
        renderPass.draw(2*POLYS_PER_CIRCLE + 1, circles.count);
        renderPass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
        frameCount++;
    };

    const animationFrame = async (timestamp) => {
        render();
        requestAnimationFrame(animationFrame);
    };
    requestAnimationFrame(animationFrame);
};

main();