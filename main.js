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
            radius: .4
        },
        {
            color: [.99, 0., 0., 1.],
            center: [0, 0],
            velocity: [.01, -.003],
            radius: .15
        }

    ])

    const circleBuffer = device.createBuffer({
        label: "circleBuffer",
        size: circles.data.byteLength,
        usage: GPUBufferUsage.STORAGE |
               GPUBufferUsage.COPY_DST |
            //    GPUBufferUsage.COPY_SRC | // used for debugging
               GPUBufferUsage.VERTEX
    });

    const physicsBindGroup = device.createBindGroup({
        label: "physicsBindGroup",
        layout: physicsPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circleBuffer},
        ]
    });

    const renderBindGroup = device.createBindGroup({
        label: "renderBindGroup",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circleBuffer},
        ]
    });

    device.queue.writeBuffer(circleBuffer, 0, circles.data);


    const render = async() => {
        const encoder = device.createCommandEncoder({label: "encoder"});

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(physicsPipeline);
        computePass.setBindGroup(0, physicsBindGroup);
        computePass.dispatchWorkgroups(circles.count);
        computePass.end();
        

        renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
        const renderPass = encoder.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(0, renderBindGroup);
        renderPass.draw(2*POLYS_PER_CIRCLE + 1, circles.count);
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